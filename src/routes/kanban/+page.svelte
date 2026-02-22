<script lang="ts">
	import KanbanBoard from '$lib/components/kanban/KanbanBoard.svelte';
</script>

<div class="kanban-page">
	<div class="page-header">
		<h2>📋 Kanban Board</h2>
		<p class="page-desc">
			Drag-and-drop task management backed by Yjs CRDTs. All changes are local-first and sync
			automatically when peers connect.
		</p>
	</div>
	<KanbanBoard />
</div>

<style>
	.kanban-page {
		padding: 0;
	}
	.page-header {
		padding: 20px 20px 0;
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
	}
</style>
