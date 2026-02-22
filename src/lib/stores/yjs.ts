import * as Y from 'yjs';

/**
 * Singleton Yjs document — the root of the entire CRDT state tree.
 *
 * Maps directly to SYSTEMS_ARCHITECTURE.md Pillar 1:
 *   rootDoc (Y.Doc)
 *   ├── projects: Y.Map<project_id, ProjectDoc>
 *   └── kanban_boards: Y.Map<board_id, KanbanBoardDoc>
 *
 * In production this is connected to y-indexeddb for persistence and
 * y-webrtc (or the custom DataChannel provider) for P2P sync.
 */
let doc: Y.Doc | null = null;

export function getYDoc(): Y.Doc {
	if (!doc) {
		doc = new Y.Doc();
	}
	return doc;
}

/** Typed helper to get a shared Y.Array by name */
export function getYArray<T>(name: string): Y.Array<T> {
	return getYDoc().getArray<T>(name);
}

/** Typed helper to get a shared Y.Map by name */
export function getYMap<T>(name: string): Y.Map<T> {
	return getYDoc().getMap<T>(name);
}

/** Generate a simple unique ID (UUID-like) */
export function uid(): string {
	return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
