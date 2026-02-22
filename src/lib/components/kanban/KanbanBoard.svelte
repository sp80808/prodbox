<script lang="ts">
	import * as Y from 'yjs';
	import KanbanColumn from './KanbanColumn.svelte';
	import type { KanbanItem } from './KanbanColumn.svelte';
	import { getYDoc, uid } from '$lib/stores/yjs';
	import { onMount, onDestroy } from 'svelte';

	interface ColumnDef {
		id: string;
		title: string;
	}

	const COLUMNS: ColumnDef[] = [
		{ id: 'backlog', title: 'Backlog' },
		{ id: 'in-progress', title: 'In Progress' },
		{ id: 'review', title: 'Review' },
		{ id: 'done', title: 'Done' }
	];

	const doc = getYDoc();

	// Each column is backed by a separate Y.Array for independent CRDT merging
	const yArrays: Record<string, Y.Array<KanbanItem>> = {};
	for (const col of COLUMNS) {
		yArrays[col.id] = doc.getArray<KanbanItem>(`kanban-${col.id}`);
	}

	// Reactive local mirrors of each column's items
	let columnItems: Record<string, KanbanItem[]> = $state(
		Object.fromEntries(COLUMNS.map((c) => [c.id, [] as KanbanItem[]]))
	);

	function syncColumn(colId: string) {
		columnItems[colId] = yArrays[colId].toArray();
	}

	function syncAll() {
		for (const col of COLUMNS) {
			syncColumn(col.id);
		}
	}

	// Observer callbacks keyed by column id
	const observers: Map<string, () => void> = new Map();

	onMount(() => {
		// Seed demo data if all columns are empty
		const totalItems = COLUMNS.reduce((sum, c) => sum + yArrays[c.id].length, 0);
		if (totalItems === 0) {
			doc.transact(() => {
				yArrays['backlog'].push([
					{ id: uid(), title: 'Record vocal stem' },
					{ id: uid(), title: 'Mix drums bus' },
					{ id: uid(), title: 'Import guitar DI' }
				]);
				yArrays['in-progress'].push([{ id: uid(), title: 'EQ lead synth' }]);
			});
		}

		syncAll();

		// Observe each Y.Array for changes
		for (const col of COLUMNS) {
			const handler = () => syncColumn(col.id);
			yArrays[col.id].observe(handler);
			observers.set(col.id, handler);
		}
	});

	onDestroy(() => {
		for (const col of COLUMNS) {
			const handler = observers.get(col.id);
			if (handler) {
				yArrays[col.id].unobserve(handler);
			}
		}
	});

	function addCard(columnId: string) {
		const title = `New stem ${uid().slice(0, 4)}`;
		yArrays[columnId].push([{ id: uid(), title }]);
	}

	function handleKanbanDrop(cardId: string, targetColumnId: string) {
		// Find which column currently holds this card
		let sourceColId: string | null = null;
		let sourceIndex = -1;
		let card: KanbanItem | null = null;

		for (const col of COLUMNS) {
			const items = yArrays[col.id].toArray();
			const idx = items.findIndex((item) => item.id === cardId);
			if (idx !== -1) {
				sourceColId = col.id;
				sourceIndex = idx;
				card = items[idx];
				break;
			}
		}

		if (!sourceColId || !card || sourceColId === targetColumnId) return;

		// Atomic Yjs transaction: remove from source, add to target
		doc.transact(() => {
			yArrays[sourceColId!].delete(sourceIndex, 1);
			yArrays[targetColumnId].push([card!]);
		});
	}
</script>

<div class="kanban-board">
	{#each COLUMNS as col (col.id)}
		<KanbanColumn
			columnId={col.id}
			columnTitle={col.title}
			items={columnItems[col.id]}
			yArray={yArrays[col.id]}
			onAddCard={addCard}
			onCardDrop={handleKanbanDrop}
		/>
	{/each}
</div>

<style>
	.kanban-board {
		display: flex;
		gap: 16px;
		padding: 20px;
		overflow-x: auto;
		min-height: 400px;
		align-items: flex-start;
	}
</style>
