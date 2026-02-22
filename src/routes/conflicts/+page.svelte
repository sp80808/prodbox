<script lang="ts">
	import StemClash from '$lib/components/conflicts/StemClash.svelte';
</script>

<div class="conflicts-page">
	<div class="page-header">
		<h2>⚡ Stem Version Clashes</h2>
		<p class="page-desc">
			When two peers upload the same stem simultaneously, Yjs detects the conflict and the project
			owner resolves it here.
		</p>
	</div>
	<div class="conflicts-content">
		<StemClash />
	</div>
</div>

<style>
	.conflicts-page {
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
	.conflicts-content {
		max-width: 700px;
	}
</style>
