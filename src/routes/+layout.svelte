<script lang="ts">
	import '$lib/styles/theme.css';
</script>

<svelte:head>
	<title>Prod Box</title>
</svelte:head>

<nav class="top-nav">
	<a href="/" class="logo">▸ PROD BOX</a>
	<div class="nav-links">
		<a href="/kanban">Kanban</a>
		<a href="/waveform">Waveform</a>
		<a href="/conflicts">Conflicts</a>
	</div>
</nav>

<main>
	<slot />
</main>

<style>
	.top-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 20px;
		border-bottom: 1px solid var(--border-color);
		background: var(--bg-secondary);
	}
	.logo {
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--neon-green);
		text-decoration: none;
		letter-spacing: 1px;
	}
	.nav-links {
		display: flex;
		gap: 16px;
	}
	.nav-links a {
		font-size: 0.8rem;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color var(--transition-fast);
	}
	.nav-links a:hover {
		color: var(--neon-cyan);
	}
	main {
		min-height: calc(100vh - 48px);
	}
</style>
