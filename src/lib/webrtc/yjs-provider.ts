/**
 * Yjs ↔ WebRTC DataChannel provider.
 *
 * From SYSTEMS_ARCHITECTURE.md Pillar 2 — "Yjs ↔ WebRTC Provider Wiring":
 *   1. Listens to doc.on('update', ...) → channel.send(update)
 *   2. Listens to channel.onmessage → Y.applyUpdate(doc, msg.data)
 *   3. On channel open, performs two-phase state-vector exchange
 *   4. On channel close, re-subscribes to signalling channel
 */
import * as Y from 'yjs';
import { getYDoc } from '../stores/yjs';

const SYNC_MESSAGE_TYPE = {
	STATE_VECTOR: 0,
	STATE_UPDATE: 1,
	INCREMENTAL_UPDATE: 2
} as const;

/**
 * Bind a Yjs document to an RTCDataChannel for P2P sync.
 * Returns a cleanup function to unbind.
 */
export function bindYjsToChannel(
	channel: RTCDataChannel,
	doc?: Y.Doc
): () => void {
	const ydoc = doc ?? getYDoc();

	// --- Incremental updates: local → remote ---
	const updateHandler = (update: Uint8Array, origin: unknown) => {
		if (origin === 'remote') return; // Don't echo back remote updates
		if (channel.readyState === 'open') {
			const msg = new Uint8Array(update.length + 1);
			msg[0] = SYNC_MESSAGE_TYPE.INCREMENTAL_UPDATE;
			msg.set(update, 1);
			channel.send(msg);
		}
	};
	ydoc.on('update', updateHandler);

	// --- Incoming messages: remote → local ---
	const messageHandler = (event: MessageEvent) => {
		const data = new Uint8Array(event.data as ArrayBuffer);
		const type = data[0];
		const payload = data.slice(1);

		switch (type) {
			case SYNC_MESSAGE_TYPE.STATE_VECTOR: {
				// Remote sent their state vector; reply with our diff
				const diff = Y.encodeStateAsUpdate(ydoc, payload);
				const msg = new Uint8Array(diff.length + 1);
				msg[0] = SYNC_MESSAGE_TYPE.STATE_UPDATE;
				msg.set(diff, 1);
				channel.send(msg);
				break;
			}
			case SYNC_MESSAGE_TYPE.STATE_UPDATE:
			case SYNC_MESSAGE_TYPE.INCREMENTAL_UPDATE:
				Y.applyUpdate(ydoc, payload, 'remote');
				break;
		}
	};
	channel.binaryType = 'arraybuffer';
	channel.addEventListener('message', messageHandler);

	// --- Phase 4: initial state-vector exchange on open ---
	const openHandler = () => {
		const sv = Y.encodeStateVector(ydoc);
		const msg = new Uint8Array(sv.length + 1);
		msg[0] = SYNC_MESSAGE_TYPE.STATE_VECTOR;
		msg.set(sv, 1);
		channel.send(msg);
	};

	if (channel.readyState === 'open') {
		openHandler();
	} else {
		channel.addEventListener('open', openHandler, { once: true });
	}

	// Cleanup
	return () => {
		ydoc.off('update', updateHandler);
		channel.removeEventListener('message', messageHandler);
	};
}
