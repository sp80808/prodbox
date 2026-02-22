<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let container: HTMLDivElement | undefined = $state();
	let wavesurfer: import('wavesurfer.js').default | null = $state(null);
	let isPlaying = $state(false);
	let currentTime = $state('0:00');
	let duration = $state('0:00');
	let zoomLevel = $state(50);
	let fileLoaded = $state(false);
	let fileName = $state('');
	let loading = $state(false);

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	onMount(async () => {
		if (!container) return;

		const WaveSurfer = (await import('wavesurfer.js')).default;
		wavesurfer = WaveSurfer.create({
			container,
			waveColor: '#39ff14',
			progressColor: '#00e5ff',
			cursorColor: '#ff00ff',
			barWidth: 2,
			barGap: 1,
			barRadius: 1,
			height: 160,
			normalize: true,
			backend: 'WebAudio'
		});

		wavesurfer.on('timeupdate', (time: number) => {
			currentTime = formatTime(time);
		});

		wavesurfer.on('decode', (dur: number) => {
			duration = formatTime(dur);
			loading = false;
			fileLoaded = true;
		});

		wavesurfer.on('play', () => {
			isPlaying = true;
		});

		wavesurfer.on('pause', () => {
			isPlaying = false;
		});
	});

	onDestroy(() => {
		wavesurfer?.destroy();
	});

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !wavesurfer) return;

		fileName = file.name;
		loading = true;

		// Read file locally — no server upload needed
		const arrayBuffer = await file.arrayBuffer();
		const blob = new Blob([arrayBuffer], { type: file.type });
		const url = URL.createObjectURL(blob);

		wavesurfer.load(url);
	}

	function togglePlay() {
		wavesurfer?.playPause();
	}

	function handleZoom(e: Event) {
		const target = e.target as HTMLInputElement;
		zoomLevel = Number(target.value);
		wavesurfer?.zoom(zoomLevel);
	}

	function skipBackward() {
		if (wavesurfer) {
			wavesurfer.setTime(Math.max(0, wavesurfer.getCurrentTime() - 5));
		}
	}

	function skipForward() {
		if (wavesurfer) {
			wavesurfer.setTime(wavesurfer.getCurrentTime() + 5);
		}
	}
</script>

<div class="waveform-viewer">
	<div class="waveform-toolbar">
		<label class="file-input-label">
			<span>{fileName || 'Load .wav file'}</span>
			<input type="file" accept=".wav,.mp3,.ogg,.flac" onchange={handleFileSelect} />
		</label>
		{#if fileLoaded}
			<span class="time-display">{currentTime} / {duration}</span>
		{/if}
	</div>

	<div class="waveform-container" bind:this={container}>
		{#if loading}
			<div class="loading-overlay">Decoding audio…</div>
		{/if}
		{#if !fileLoaded && !loading}
			<div class="placeholder">Drop a .wav file or click "Load .wav file" to begin</div>
		{/if}
	</div>

	{#if fileLoaded}
		<div class="waveform-controls">
			<button onclick={skipBackward} aria-label="Skip backward 5s">⏪ -5s</button>
			<button class="play-btn" onclick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
				{isPlaying ? '⏸' : '▶'}
			</button>
			<button onclick={skipForward} aria-label="Skip forward 5s">+5s ⏩</button>
			<div class="zoom-control">
				<span class="zoom-label">Zoom</span>
				<input
					type="range"
					min="10"
					max="500"
					value={zoomLevel}
					oninput={handleZoom}
					aria-label="Zoom level"
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	.waveform-viewer {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.waveform-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-color);
	}
	.file-input-label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-size: 0.8rem;
		color: var(--neon-green);
		border: 1px solid var(--border-color);
		padding: 6px 12px;
		border-radius: var(--radius);
		transition: border-color var(--transition-fast);
	}
	.file-input-label:hover {
		border-color: var(--neon-green);
	}
	.file-input-label input {
		display: none;
	}
	.time-display {
		font-size: 0.8rem;
		color: var(--neon-cyan);
		font-variant-numeric: tabular-nums;
	}
	.waveform-container {
		position: relative;
		min-height: 160px;
		background: var(--bg-primary);
	}
	.loading-overlay,
	.placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.loading-overlay {
		color: var(--neon-cyan);
	}
	.waveform-controls {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		border-top: 1px solid var(--border-color);
	}
	.play-btn {
		font-size: 1.1rem;
		padding: 6px 16px;
		border-color: var(--neon-green);
		color: var(--neon-green);
	}
	.zoom-control {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: auto;
	}
	.zoom-label {
		font-size: 0.7rem;
		color: var(--text-muted);
		text-transform: uppercase;
	}
	.zoom-control input[type='range'] {
		width: 120px;
		accent-color: var(--neon-cyan);
	}
</style>
