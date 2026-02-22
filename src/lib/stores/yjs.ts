import * as Y from 'yjs';

/**
 * Singleton Yjs document for local-first collaboration.
 * In production, this would be connected to a WebRTC provider
 * (e.g. y-webrtc) for P2P sync. For offline-first operation,
 * the Y.Doc works entirely in-memory and persists via IndexedDB.
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

/** Generate a simple unique ID */
export function uid(): string {
	return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
