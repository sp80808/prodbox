<script module lang="ts">
	export interface KanbanItem {
		id: string;
		title: string;
	}
</script>

<script lang="ts">
	import KanbanCard from './KanbanCard.svelte';
	import type * as Y from 'yjs';

	interface Props {
		columnId: string;
		columnTitle: string;
		items: KanbanItem[];
		yArray: Y.Array<KanbanItem>;
		onAddCard?: (columnId: string) => void;
		onCardDrop?: (cardId: string, targetColumnId: string) => void;
	}

	let { columnId, columnTitle, items, yArray, onAddCard, onCardDrop }: Props = $props();
	let dragOver = $state(false);

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
		dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		if (!e.dataTransfer) return;

		const raw = e.dataTransfer.getData('text/plain');
		if (!raw) return;

		try {
			const data: { cardId: string } = JSON.parse(raw);
			onCardDrop?.(data.cardId, columnId);
		} catch {
			// Ignore malformed data
		}
	}

	function removeCard(index: number) {
		yArray.delete(index, 1);
	}
</script>

<div
	class="kanban-column"
	class:drag-over={dragOver}
	role="list"
	aria-label={columnTitle}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<div class="column-header">
		<span class="column-title">{columnTitle}</span>
		<span class="column-count">{items.length}</span>
	</div>
	<div class="column-cards">
		{#each items as item, i (item.id)}
			<KanbanCard id={item.id} title={item.title} onRemove={() => removeCard(i)} />
		{/each}
	</div>
	{#if onAddCard}
		<button class="add-card-btn" onclick={() => onAddCard?.(columnId)}>+ Add Card</button>
	{/if}
</div>

<style>
	.kanban-column {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		min-width: 260px;
		max-width: 300px;
		display: flex;
		flex-direction: column;
		transition: border-color var(--transition-fast);
	}
	.kanban-column.drag-over {
		border-color: var(--neon-green);
	}
	.column-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 14px;
		border-bottom: 1px solid var(--border-color);
	}
	.column-title {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--neon-cyan);
	}
	.column-count {
		font-size: 0.7rem;
		color: var(--text-muted);
		background: var(--bg-tertiary);
		padding: 2px 6px;
		border-radius: var(--radius);
	}
	.column-cards {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
		flex: 1;
		min-height: 80px;
	}
	.add-card-btn {
		margin: 0 12px 12px;
		background: transparent;
		border: 1px dashed var(--border-color);
		color: var(--text-muted);
		font-size: 0.75rem;
	}
	.add-card-btn:hover {
		border-color: var(--neon-green);
		color: var(--neon-green);
	}
</style>
