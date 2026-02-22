<script lang="ts">
	import { onMount } from 'svelte';

	let version = '0.1.0';

	onMount(async () => {
		// Only import Tauri APIs in the desktop context
		if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
			const { getVersion } = await import('@tauri-apps/api/app');
			version = await getVersion();
		}
	});
</script>

<main class="flex flex-col items-center justify-center min-h-screen bg-charcoal-900 text-white">
	<div class="text-center space-y-6 max-w-xl px-6">
		<!-- Wordmark -->
		<h1 class="font-display text-5xl font-black tracking-tight">
			Prod<span class="text-neon-blue">Box</span>
		</h1>

		<p class="text-charcoal-300 text-lg leading-relaxed">
			Desktop-first peer-to-peer audio collaboration.<br />
			Zero server storage. Full creative control.
		</p>

		<div class="flex gap-4 justify-center pt-4">
			<a href="/projects" class="btn-primary">Open Projects</a>
			<a href="/settings" class="border border-charcoal-400 text-charcoal-300 hover:text-white px-4 py-2 rounded transition-colors">
				Settings
			</a>
		</div>

		<p class="label-mono text-charcoal-400">v{version}</p>
	</div>
</main>
