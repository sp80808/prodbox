/**
 * Pillar 2 — WebRTC Signalling via Supabase Realtime.
 *
 * Implements the connection flow from SYSTEMS_ARCHITECTURE.md:
 *   Phase 1 — Signalling (offer/answer via Supabase Realtime)
 *   Phase 2 — ICE Candidate Exchange
 *   Phase 3 — Direct P2P DataChannel open
 *   Phase 4 — Yjs sync over DataChannel
 */

/** ICE server configuration per SYSTEMS_ARCHITECTURE.md */
export const ICE_SERVERS: RTCIceServer[] = [
	{ urls: 'stun:stun.l.google.com:19302' },
	{
		urls: [
			'stun:turn.prodbox.app:3478',
			'turn:turn.prodbox.app:3478?transport=udp',
			'turn:turn.prodbox.app:3478?transport=tcp',
			'turns:turn.prodbox.app:5349?transport=tcp'
		],
		username: '',
		credential: ''
	}
];

export interface SignalMessage {
	type: 'offer' | 'answer' | 'ice-candidate';
	sdp?: string;
	candidate?: RTCIceCandidateInit;
	from: string;
}

/**
 * Create an RTCPeerConnection with the Prod Box ICE configuration and
 * a "yjs-sync" DataChannel for CRDT updates.
 */
export function createPeerConnection(): {
	pc: RTCPeerConnection;
	channel: RTCDataChannel;
} {
	const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
	const channel = pc.createDataChannel('yjs-sync', { ordered: true });
	return { pc, channel };
}

/**
 * Accept an incoming peer connection. The responder listens for
 * the remote "yjs-sync" channel via ondatachannel.
 */
export function acceptPeerConnection(): {
	pc: RTCPeerConnection;
	channelPromise: Promise<RTCDataChannel>;
} {
	const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
	const channelPromise = new Promise<RTCDataChannel>((resolve) => {
		pc.ondatachannel = (event) => {
			if (event.channel.label === 'yjs-sync') {
				resolve(event.channel);
			}
		};
	});
	return { pc, channelPromise };
}
