use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;
use tauri::Manager;

/// Pillar 3 — Tauri IPC Layer
///
/// Provides type-safe, async event bridge between SvelteKit (WebView) and
/// the Rust backend for DAW file parsing and filesystem write progress.

// ─── DawMeta — Python parser output contract ────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct DawStem {
    pub filename: String,
    pub format: String,
    pub size_bytes: u64,
    pub duration_seconds: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DawTrack {
    pub name: String,
    #[serde(rename = "type")]
    pub track_type: String,
    pub stems: Vec<DawStem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DawMeta {
    pub format: String,
    pub bpm: f64,
    pub sample_rate: u32,
    pub time_signature: String,
    pub tracks: Vec<DawTrack>,
}

// ─── WriteProgress — filesystem write progress event ────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct WriteProgress {
    pub stem_id: String,
    pub filename: String,
    pub bytes_written: u64,
    pub total_bytes: u64,
    pub percent: f64,
    pub overall_percent: f64,
}

// ─── Tauri commands ─────────────────────────────────────────────────────────

/// Parse a DAW project file by spawning the appropriate Python sidecar.
/// Validates that the path exists and has a supported extension.
#[tauri::command]
async fn parse_daw_project(
    path: String,
    app_handle: tauri::AppHandle,
) -> Result<DawMeta, String> {
    let file_path = Path::new(&path);

    // Validate path exists
    if !file_path.exists() {
        let _ = app_handle.emit("daw:parse-error", serde_json::json!({
            "error": format!("File not found: {}", path)
        }));
        return Err(format!("File not found: {}", path));
    }

    // Determine parser based on extension
    let ext = file_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    let parser_script = match ext {
        "als" => "parsers/parse_daw.py",
        "logicx" => "parsers/parse_daw.py",
        "flp" => "parsers/parse_daw.py",
        _ => {
            let msg = format!("Unsupported DAW format: .{}", ext);
            let _ = app_handle.emit("daw:parse-error", serde_json::json!({
                "error": &msg
            }));
            return Err(msg);
        }
    };

    // Spawn Python parser as child process (path as single CLI argument, no shell interpolation)
    let output = Command::new("python3")
        .arg(parser_script)
        .arg(&path)
        .output()
        .map_err(|e| {
            let msg = format!("Failed to spawn parser: {}", e);
            let _ = app_handle.emit("daw:parse-error", serde_json::json!({
                "error": &msg
            }));
            msg
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let _ = app_handle.emit("daw:parse-error", serde_json::json!({
            "error": &stderr
        }));
        return Err(stderr);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let meta: DawMeta = serde_json::from_str(&stdout).map_err(|e| {
        let msg = format!("Failed to parse output: {}", e);
        let _ = app_handle.emit("daw:parse-error", serde_json::json!({
            "error": &msg
        }));
        msg
    })?;

    let _ = app_handle.emit("daw:parse-complete", &meta);
    Ok(meta)
}

/// Write stems to disk with real-time progress reporting.
#[tauri::command]
async fn write_stems_to_disk(
    project_id: String,
    dest: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let dest_path = Path::new(&dest);
    if !dest_path.exists() {
        std::fs::create_dir_all(dest_path)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // Placeholder: in production, resolve stem file list from project state
    let _ = app_handle.emit("fs:write-progress", WriteProgress {
        stem_id: project_id.clone(),
        filename: String::new(),
        bytes_written: 0,
        total_bytes: 0,
        percent: 0.0,
        overall_percent: 0.0,
    });

    Ok(())
}

/// Register Tauri commands and plugins, then run the app.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .invoke_handler(tauri::generate_handler![
            parse_daw_project,
            write_stems_to_disk,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Prod Box");
}
