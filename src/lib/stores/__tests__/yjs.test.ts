import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';

// Test the Yjs-backed kanban data model logic directly
// (mirrors what KanbanBoard.svelte does with Y.Arrays)

interface KanbanItem {
	id: string;
	title: string;
}

describe('Yjs Kanban Data Model', () => {
	let doc: Y.Doc;
	let backlog: Y.Array<KanbanItem>;
	let inProgress: Y.Array<KanbanItem>;
	let review: Y.Array<KanbanItem>;

	beforeEach(() => {
		doc = new Y.Doc();
		backlog = doc.getArray<KanbanItem>('kanban-backlog');
		inProgress = doc.getArray<KanbanItem>('kanban-in-progress');
		review = doc.getArray<KanbanItem>('kanban-review');
	});

	it('should add items to a column', () => {
		backlog.push([{ id: '1', title: 'Record vocal stem' }]);
		expect(backlog.length).toBe(1);
		expect(backlog.get(0).title).toBe('Record vocal stem');
	});

	it('should move items between columns atomically', () => {
		backlog.push([
			{ id: '1', title: 'Task A' },
			{ id: '2', title: 'Task B' }
		]);

		const card = backlog.get(0);

		doc.transact(() => {
			backlog.delete(0, 1);
			inProgress.push([card]);
		});

		expect(backlog.length).toBe(1);
		expect(backlog.get(0).title).toBe('Task B');
		expect(inProgress.length).toBe(1);
		expect(inProgress.get(0).title).toBe('Task A');
	});

	it('should delete items from a column', () => {
		backlog.push([
			{ id: '1', title: 'Task A' },
			{ id: '2', title: 'Task B' },
			{ id: '3', title: 'Task C' }
		]);

		backlog.delete(1, 1);

		expect(backlog.length).toBe(2);
		expect(backlog.get(0).title).toBe('Task A');
		expect(backlog.get(1).title).toBe('Task C');
	});

	it('should handle concurrent changes via separate Y.Docs', () => {
		// Simulate two peers with separate docs
		const doc1 = new Y.Doc();
		const doc2 = new Y.Doc();

		const arr1 = doc1.getArray<KanbanItem>('kanban-backlog');
		const arr2 = doc2.getArray<KanbanItem>('kanban-backlog');

		// Peer 1 adds a card
		arr1.push([{ id: 'a', title: 'From peer 1' }]);

		// Peer 2 adds a card (concurrently, before sync)
		arr2.push([{ id: 'b', title: 'From peer 2' }]);

		// Sync: apply updates from doc1 to doc2 and vice versa
		const update1 = Y.encodeStateAsUpdate(doc1);
		const update2 = Y.encodeStateAsUpdate(doc2);
		Y.applyUpdate(doc2, update1);
		Y.applyUpdate(doc1, update2);

		// Both docs should now have both cards
		expect(arr1.length).toBe(2);
		expect(arr2.length).toBe(2);

		const titles1 = arr1.toArray().map((i) => i.title).sort();
		const titles2 = arr2.toArray().map((i) => i.title).sort();
		expect(titles1).toEqual(['From peer 1', 'From peer 2']);
		expect(titles2).toEqual(['From peer 1', 'From peer 2']);
	});

	it('should notify observers on changes', () => {
		let changeCount = 0;
		backlog.observe(() => {
			changeCount++;
		});

		backlog.push([{ id: '1', title: 'Task A' }]);
		expect(changeCount).toBe(1);

		backlog.push([{ id: '2', title: 'Task B' }]);
		expect(changeCount).toBe(2);

		doc.transact(() => {
			backlog.delete(0, 1);
			backlog.push([{ id: '3', title: 'Task C' }]);
		});
		// Transaction groups changes into a single notification
		expect(changeCount).toBe(3);
	});
});

describe('Yjs Stem Conflict Data Model', () => {
	let doc: Y.Doc;

	interface StemVersion {
		id: string;
		stemName: string;
		uploadedBy: string;
		timestamp: number;
		fileSize: string;
		hash: string;
	}

	interface StemConflict {
		stemName: string;
		versions: StemVersion[];
		resolved: boolean;
		chosenVersionId: string | null;
	}

	let yConflicts: Y.Map<StemConflict>;
	let yStems: Y.Map<StemVersion>;

	beforeEach(() => {
		doc = new Y.Doc();
		yConflicts = doc.getMap<StemConflict>('stem-conflicts');
		yStems = doc.getMap<StemVersion>('stems');
	});

	it('should register a stem conflict', () => {
		const v1: StemVersion = {
			id: 'v1',
			stemName: 'vocals.wav',
			uploadedBy: 'alice',
			timestamp: 1000,
			fileSize: '10 MB',
			hash: 'abc'
		};
		const v2: StemVersion = {
			id: 'v2',
			stemName: 'vocals.wav',
			uploadedBy: 'bob',
			timestamp: 2000,
			fileSize: '11 MB',
			hash: 'def'
		};

		yConflicts.set('vocals.wav', {
			stemName: 'vocals.wav',
			versions: [v1, v2],
			resolved: false,
			chosenVersionId: null
		});

		expect(yConflicts.size).toBe(1);
		const conflict = yConflicts.get('vocals.wav')!;
		expect(conflict.versions.length).toBe(2);
		expect(conflict.resolved).toBe(false);
	});

	it('should resolve a conflict by choosing a version', () => {
		const v1: StemVersion = {
			id: 'v1',
			stemName: 'vocals.wav',
			uploadedBy: 'alice',
			timestamp: 1000,
			fileSize: '10 MB',
			hash: 'abc'
		};
		const v2: StemVersion = {
			id: 'v2',
			stemName: 'vocals.wav',
			uploadedBy: 'bob',
			timestamp: 2000,
			fileSize: '11 MB',
			hash: 'def'
		};

		yConflicts.set('vocals.wav', {
			stemName: 'vocals.wav',
			versions: [v1, v2],
			resolved: false,
			chosenVersionId: null
		});

		// Resolve: choose v1
		const conflict = yConflicts.get('vocals.wav')!;
		doc.transact(() => {
			yConflicts.set('vocals.wav', {
				...conflict,
				resolved: true,
				chosenVersionId: 'v1'
			});
			yStems.set('vocals.wav', v1);
		});

		const resolved = yConflicts.get('vocals.wav')!;
		expect(resolved.resolved).toBe(true);
		expect(resolved.chosenVersionId).toBe('v1');
		expect(yStems.get('vocals.wav')?.uploadedBy).toBe('alice');
	});

	it('should dismiss a resolved conflict', () => {
		yConflicts.set('vocals.wav', {
			stemName: 'vocals.wav',
			versions: [],
			resolved: true,
			chosenVersionId: 'v1'
		});

		yConflicts.delete('vocals.wav');
		expect(yConflicts.size).toBe(0);
	});
});
