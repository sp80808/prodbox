<script lang="ts">
	export let id: string;
	export let title: string;
	export let onRemove: (() => void) | undefined = undefined;

	let dragging = false;

	function handleDragStart(e: DragEvent) {
		if (!e.dataTransfer) return;
		e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: id }));
		e.dataTransfer.effectAllowed = 'move';
		dragging = true;
	}

	function handleDragEnd() {
		dragging = false;
	}
</script>

<div
	class="kanban-card"
	class:dragging
	draggable="true"
	role="listitem"
	on:dragstart={handleDragStart}
	on:dragend={handleDragEnd}
>
	<div class="card-header">
		<span class="card-title">{title}</span>
		{#if onRemove}
			<button class="remove-btn" on:click={onRemove} aria-label="Remove card">×</button>
		{/if}
	</div>
	<slot />
</div>

<style>
	.kanban-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		padding: 10px 12px;
		cursor: grab;
		transition:
			border-color var(--transition-fast),
			opacity var(--transition-fast);
		user-select: none;
	}
	.kanban-card:hover {
		border-color: var(--neon-cyan);
	}
	.kanban-card.dragging {
		opacity: 0.4;
		border-color: var(--neon-green);
	}
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}
	.card-title {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.remove-btn {
		padding: 0 4px;
		border: none;
		background: none;
		color: var(--text-muted);
		font-size: 1rem;
		line-height: 1;
	}
	.remove-btn:hover {
		color: var(--neon-red);
		border: none;
	}
	.card-body {
		margin-top: 6px;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
</style>
