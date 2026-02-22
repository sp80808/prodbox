/**
 * Yjs CRDT collaborative state — shared Kanban boards, tasks, and timelines.
 *
 * Uses y-webrtc for peer-to-peer document sync without a central persistence server.
 * Supabase Realtime is used only to exchange signalling messages (offer/answer/ICE).
 */
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

export interface Project {
	id: string;
	name: string;
	bpm: number;
	key: string;
}

/**
 * Create a shared Yjs document for a given project room.
 * The room name doubles as the WebRTC signalling channel identifier.
 */
export function createProjectDoc(roomId: string, signalingUrls: string[]) {
	const doc = new Y.Doc();

	const provider = new WebrtcProvider(roomId, doc, {
		signaling: signalingUrls,
		maxConns: 20,
		filterBcConns: true,
		peerOpts: {
			config: {
				iceServers: [
					{ urls: 'stun:stun.l.google.com:19302' },
					{ urls: 'stun:stun1.l.google.com:19302' }
				]
			}
		}
	});

	// Shared data structures
	const tasks     = doc.getArray<Y.Map<unknown>>('tasks');
	const stems     = doc.getArray<Y.Map<unknown>>('stems');
	const timeline  = doc.getMap<unknown>('timeline');
	const awareness = provider.awareness;

	return { doc, provider, tasks, stems, timeline, awareness };
}
