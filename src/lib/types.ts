/**
 * IPC and domain types derived from SYSTEMS_ARCHITECTURE.md.
 *
 * These mirror the Postgres schema (Appendix A) and the Yjs document tree
 * (Pillar 1), plus the IPC payload types from Pillar 3.
 */

// ─── Pillar 1 — Yjs / Postgres entity types ─────────────────────────────────

export interface ProjectDoc {
	name: string;
	bpm: number;
	sample_rate: number;
	created_at: string;
	updated_at: string;
}

export interface TrackDoc {
	track_id: string;
	name: string;
	position: number;
	muted: boolean;
	solo: boolean;
}

export interface StemDoc {
	stem_id: string;
	filename: string;
	format: 'wav' | 'flac' | 'mp3';
	size_bytes: number;
	uploaded_at: string;
}

export interface StemVersionDoc {
	version_id: string;
	hash_sha256: string;
	created_at: string;
	comment: string;
}

export interface KanbanBoardDoc {
	name: string;
	project_id: string;
}

export interface KanbanColumnDoc {
	column_id: string;
	title: string;
	position: number;
}

export interface KanbanCardDoc {
	card_id: string;
	title: string;
	body: string;
	assignee_id: string;
	position: number;
	created_at: string;
}

// ─── Pillar 3 — Tauri IPC payload types ──────────────────────────────────────

/** Returned by parse_daw_project */
export interface DawMeta {
	format: 'logicx' | 'als' | 'flp';
	bpm: number;
	sample_rate: number;
	time_signature: string;
	tracks: DawTrack[];
}

export interface DawTrack {
	name: string;
	type: 'audio' | 'midi' | 'aux';
	stems: DawStem[];
}

export interface DawStem {
	filename: string;
	format: 'wav' | 'flac' | 'mp3';
	size_bytes: number;
	duration_seconds: number;
}

/** Emitted during write_stems_to_disk */
export interface WriteProgressEvent {
	stem_id: string;
	filename: string;
	bytes_written: number;
	total_bytes: number;
	percent: number;
	overall_percent: number;
}
