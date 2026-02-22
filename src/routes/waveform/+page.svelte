<script lang="ts">
	import WaveformViewer from '$lib/components/waveform/WaveformViewer.svelte';
</script>

<div class="waveform-page">
	<div class="page-header">
		<h2>🎵 Offline Waveform Viewer</h2>
		<p class="page-desc">
			Load a local audio file and render a zoomable waveform entirely on the client via the Web
			Audio API. No server required.
		</p>
	</div>
	<div class="waveform-content">
		<WaveformViewer />
	</div>
</div>

<style>
	.waveform-page {
		padding: 20px;
	}
	.page-header h2 {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--neon-cyan);
		margin-bottom: 4px;
	}
	.page-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-bottom: 20px;
	}
	.waveform-content {
		max-width: 900px;
	}
</style>
