/**
 * Tauri filesystem helpers.
 *
 * Uses @tauri-apps/api for IPC invoke calls to the Rust backend.
 * The Rust side handles fs-plugin, dialog-plugin, and persisted-scope.
 * Incoming stems drop silently into the user's DAW folder.
 */

/**
 * Open a folder picker dialog via Tauri IPC and return the selected path.
 * Falls back to null if not running inside Tauri.
 */
export async function pickDawFolder(): Promise<string | null> {
	try {
		const { invoke } = await import('@tauri-apps/api/core');
		return await invoke<string | null>('pick_daw_folder');
	} catch {
		// Not in Tauri context (e.g., running in browser during dev)
		return null;
	}
}

/**
 * Write a stem file to the user's authorised DAW folder via Tauri IPC.
 */
export async function writeStemToFolder(
	folderPath: string,
	filename: string,
	data: Uint8Array
): Promise<void> {
	try {
		const { invoke } = await import('@tauri-apps/api/core');
		await invoke('write_stem', {
			folderPath,
			filename,
			data: Array.from(data)
		});
	} catch {
		// Not in Tauri context
		console.warn('writeStemToFolder requires Tauri runtime');
	}
}
