/**
 * WebRTC DataChannel file transfer with 64 KB chunking and backpressure.
 *
 * From README: "500MB+ .wav files fly strictly peer-to-peer via WebRTC
 * DataChannels. Built with strict 64KB chunking and bufferedAmount
 * backpressure so your browser doesn't choke."
 */

const CHUNK_SIZE = 64 * 1024; // 64 KB
const BUFFER_HIGH_WATERMARK = 16 * 1024 * 1024; // 16 MB

export interface TransferProgress {
	filename: string;
	bytesSent: number;
	totalBytes: number;
	percent: number;
}

/**
 * Send a file over an RTCDataChannel in 64 KB chunks with backpressure.
 */
export async function sendFile(
	channel: RTCDataChannel,
	file: File,
	onProgress?: (progress: TransferProgress) => void
): Promise<void> {
	const buffer = await file.arrayBuffer();
	const totalBytes = buffer.byteLength;
	let offset = 0;

	// Send filename + size as header
	channel.send(JSON.stringify({ filename: file.name, size: totalBytes }));

	while (offset < totalBytes) {
		// Backpressure: wait if buffer is above high watermark
		while (channel.bufferedAmount > BUFFER_HIGH_WATERMARK) {
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		const end = Math.min(offset + CHUNK_SIZE, totalBytes);
		const chunk = buffer.slice(offset, end);
		channel.send(chunk);
		offset = end;

		onProgress?.({
			filename: file.name,
			bytesSent: offset,
			totalBytes,
			percent: Math.round((offset / totalBytes) * 100)
		});
	}
}

/**
 * Receive a file over an RTCDataChannel. Returns a Blob when complete.
 */
export function receiveFile(
	channel: RTCDataChannel,
	onProgress?: (progress: TransferProgress) => void
): Promise<{ filename: string; blob: Blob }> {
	return new Promise((resolve) => {
		let filename = '';
		let totalBytes = 0;
		let received = 0;
		const chunks: ArrayBuffer[] = [];

		channel.onmessage = (event) => {
			if (typeof event.data === 'string') {
				// Header message
				const header = JSON.parse(event.data) as { filename: string; size: number };
				filename = header.filename;
				totalBytes = header.size;
				return;
			}

			// Binary chunk
			const chunk = event.data as ArrayBuffer;
			chunks.push(chunk);
			received += chunk.byteLength;

			onProgress?.({
				filename,
				bytesSent: received,
				totalBytes,
				percent: Math.round((received / totalBytes) * 100)
			});

			if (received >= totalBytes) {
				const blob = new Blob(chunks);
				resolve({ filename, blob });
			}
		};
	});
}
