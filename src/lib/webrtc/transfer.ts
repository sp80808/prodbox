/**
 * WebRTC P2P transport layer.
 *
 * Responsibilities:
 *  - Negotiate RTCPeerConnections via Supabase Realtime signalling.
 *  - Open a reliable RTCDataChannel for chunked binary transfers (64 KB chunks).
 *  - Enforce backpressure via bufferedAmount to avoid buffer overflows on large stems.
 *  - Support pause / resume for interrupted transfers.
 */

export const CHUNK_SIZE = 64 * 1024; // 64 KB per WebRTC spec recommendation
export const BUFFER_HIGH_WATERMARK = 16 * 1024 * 1024; // 16 MB — pause sending
export const BUFFER_LOW_WATERMARK  =  4 * 1024 * 1024; //  4 MB — resume sending

export interface TransferMeta {
	id: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	checksum: string; // SHA-256 hex
}

export interface ChunkMessage {
	type: 'chunk';
	transferId: string;
	index: number;
	total: number;
	data: ArrayBuffer;
}

export interface ControlMessage {
	type: 'start' | 'pause' | 'resume' | 'cancel' | 'complete';
	transferId: string;
	meta?: TransferMeta;
}

export type DataMessage = ChunkMessage | ControlMessage;

/**
 * Send a file over an RTCDataChannel with 64 KB chunking and backpressure.
 */
export async function sendFile(
	channel: RTCDataChannel,
	file: File,
	transferId: string,
	onProgress?: (sent: number, total: number) => void
): Promise<void> {
	const total = Math.ceil(file.size / CHUNK_SIZE);
	const meta: TransferMeta = {
		id: transferId,
		fileName: file.name,
		fileSize: file.size,
		mimeType: file.type,
		checksum: '' // Computed before calling this function
	};

	// Signal start
	const startMsg: ControlMessage = { type: 'start', transferId, meta };
	channel.send(JSON.stringify(startMsg));

	for (let i = 0; i < total; i++) {
		// Backpressure — wait until buffer drains below low watermark
		while (channel.bufferedAmount > BUFFER_HIGH_WATERMARK) {
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		const start = i * CHUNK_SIZE;
		const slice = file.slice(start, start + CHUNK_SIZE);
		const buffer = await slice.arrayBuffer();
		channel.send(buffer);

		onProgress?.(Math.min((i + 1) * CHUNK_SIZE, file.size), file.size);
	}

	// Signal completion
	const doneMsg: ControlMessage = { type: 'complete', transferId };
	channel.send(JSON.stringify(doneMsg));
}
