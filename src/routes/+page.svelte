<div class="landing">
	<h1>Prod Box</h1>
	<p class="subtitle">Zero-latency, peer-to-peer audio collaboration hub</p>
	<p class="tagline">Local-first · Offline-capable · CRDT-powered</p>
	<div class="nav-grid">
		<a href="/kanban" class="nav-card">
			<span class="card-icon">📋</span>
			<span class="card-label">Kanban Board</span>
			<span class="card-desc">Yjs-backed drag-and-drop task management</span>
		</a>
		<a href="/waveform" class="nav-card">
			<span class="card-icon">🎵</span>
			<span class="card-label">Waveform Viewer</span>
			<span class="card-desc">Offline audio parsing with zoomable waveforms</span>
		</a>
		<a href="/conflicts" class="nav-card">
			<span class="card-icon">⚡</span>
			<span class="card-label">Stem Conflicts</span>
			<span class="card-desc">P2P conflict resolution for simultaneous uploads</span>
		</a>
	</div>
</div>

<style>
	.landing {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 48px);
		padding: 40px 20px;
		text-align: center;
	}
	h1 {
		font-size: 2.4rem;
		font-weight: 700;
		color: var(--neon-green);
		letter-spacing: 2px;
		margin-bottom: 8px;
	}
	.subtitle {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin-bottom: 4px;
	}
	.tagline {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-bottom: 40px;
	}
	.nav-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 16px;
		max-width: 800px;
		width: 100%;
	}
	.nav-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 24px 16px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		text-decoration: none;
		transition: border-color var(--transition-fast);
	}
	.nav-card:hover {
		border-color: var(--neon-cyan);
	}
	.card-icon {
		font-size: 1.6rem;
	}
	.card-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	.card-desc {
		font-size: 0.7rem;
		color: var(--text-muted);
	}
</style>
