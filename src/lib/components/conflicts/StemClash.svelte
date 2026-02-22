<script context="module" lang="ts">
	export interface StemVersion {
		id: string;
		stemName: string;
		uploadedBy: string;
		timestamp: number;
		fileSize: string;
		hash: string;
	}

	export interface StemConflict {
		stemName: string;
		versions: StemVersion[];
		resolved: boolean;
		chosenVersionId: string | null;
	}
</script>

<script lang="ts">
	import * as Y from 'yjs';
	import { getYDoc, uid } from '$lib/stores/yjs';
	import { onMount, onDestroy } from 'svelte';

	const doc = getYDoc();
	const yConflicts = doc.getMap<StemConflict>('stem-conflicts');
	const yStems = doc.getMap<StemVersion>('stems');

	let conflicts: StemConflict[] = [];

	function syncConflicts() {
		const result: StemConflict[] = [];
		yConflicts.forEach((conflict) => {
			result.push({ ...conflict });
		});
		conflicts = result;
	}

	let conflictsObserver: (() => void) | null = null;

	onMount(() => {
		if (yConflicts.size === 0) {
			seedDemoConflicts();
		}
		syncConflicts();

		conflictsObserver = () => syncConflicts();
		yConflicts.observe(conflictsObserver);
	});

	onDestroy(() => {
		if (conflictsObserver) {
			yConflicts.unobserve(conflictsObserver);
		}
	});

	function seedDemoConflicts() {
		doc.transact(() => {
			const v1: StemVersion = {
				id: uid(),
				stemName: 'vocals_lead.wav',
				uploadedBy: 'alice',
				timestamp: Date.now() - 30000,
				fileSize: '24.3 MB',
				hash: 'a3f2c1...'
			};
			const v2: StemVersion = {
				id: uid(),
				stemName: 'vocals_lead.wav',
				uploadedBy: 'bob',
				timestamp: Date.now() - 15000,
				fileSize: '24.1 MB',
				hash: 'b7e4d2...'
			};
			yConflicts.set('vocals_lead.wav', {
				stemName: 'vocals_lead.wav',
				versions: [v1, v2],
				resolved: false,
				chosenVersionId: null
			});

			const v3: StemVersion = {
				id: uid(),
				stemName: 'bass_di.wav',
				uploadedBy: 'charlie',
				timestamp: Date.now() - 60000,
				fileSize: '18.7 MB',
				hash: 'c9a1f3...'
			};
			const v4: StemVersion = {
				id: uid(),
				stemName: 'bass_di.wav',
				uploadedBy: 'alice',
				timestamp: Date.now() - 5000,
				fileSize: '18.9 MB',
				hash: 'd2b5e6...'
			};
			yConflicts.set('bass_di.wav', {
				stemName: 'bass_di.wav',
				versions: [v3, v4],
				resolved: false,
				chosenVersionId: null
			});
		});
	}

	function resolveConflict(stemName: string, chosenVersionId: string) {
		const conflict = yConflicts.get(stemName);
		if (!conflict) return;

		const chosen = conflict.versions.find((v) => v.id === chosenVersionId);
		if (!chosen) return;

		doc.transact(() => {
			yConflicts.set(stemName, {
				...conflict,
				resolved: true,
				chosenVersionId
			});
			yStems.set(stemName, chosen);
		});
	}

	function dismissConflict(stemName: string) {
		yConflicts.delete(stemName);
	}

	function simulateConflict() {
		const name = `stem_${uid().slice(0, 4)}.wav`;
		doc.transact(() => {
			const v1: StemVersion = {
				id: uid(),
				stemName: name,
				uploadedBy: 'peer-A',
				timestamp: Date.now() - 2000,
				fileSize: `${(Math.random() * 50 + 5).toFixed(1)} MB`,
				hash: uid()
			};
			const v2: StemVersion = {
				id: uid(),
				stemName: name,
				uploadedBy: 'peer-B',
				timestamp: Date.now(),
				fileSize: `${(Math.random() * 50 + 5).toFixed(1)} MB`,
				hash: uid()
			};
			yConflicts.set(name, {
				stemName: name,
				versions: [v1, v2],
				resolved: false,
				chosenVersionId: null
			});
		});
	}
</script>

<div class="stem-clash">
	<div class="clash-toolbar">
		<span class="clash-count">{conflicts.filter((c) => !c.resolved).length} active conflicts</span>
		<button on:click={simulateConflict}>Simulate Conflict</button>
	</div>

	{#each conflicts as conflict (conflict.stemName)}
		<div class="conflict-card" class:resolved={conflict.resolved}>
			<div class="conflict-header">
				<span class="stem-name">{conflict.stemName}</span>
				{#if conflict.resolved}
					<span class="resolved-badge">✓ Resolved</span>
				{/if}
			</div>

			{#if !conflict.resolved}
				<div class="versions">
					{#each conflict.versions as version (version.id)}
						<div class="version-row">
							<div class="version-meta">
								<span class="uploader">{version.uploadedBy}</span>
								<span class="timestamp">{new Date(version.timestamp).toLocaleTimeString()}</span>
								<span class="file-size">{version.fileSize}</span>
								<span class="hash">{version.hash}</span>
							</div>
							<button
								class="choose-btn"
								on:click={() => resolveConflict(conflict.stemName, version.id)}
							>
								Choose
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<button class="dismiss-btn" on:click={() => dismissConflict(conflict.stemName)}>
					Dismiss
				</button>
			{/if}
		</div>
	{/each}

	{#if conflicts.length === 0}
		<p class="no-conflicts">No stem conflicts detected.</p>
	{/if}
</div>

<style>
	.stem-clash {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.clash-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}
	.clash-count {
		font-size: 0.8rem;
		color: var(--neon-cyan);
	}
	.conflict-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		padding: 14px;
	}
	.conflict-card.resolved {
		opacity: 0.6;
		border-color: var(--neon-green);
	}
	.conflict-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}
	.stem-name {
		font-weight: 700;
		font-size: 0.85rem;
		color: var(--text-primary);
	}
	.resolved-badge {
		font-size: 0.7rem;
		color: var(--neon-green);
	}
	.versions {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.version-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px;
		background: var(--bg-tertiary);
		border-radius: var(--radius);
	}
	.version-meta {
		display: flex;
		gap: 12px;
		font-size: 0.75rem;
	}
	.uploader {
		color: var(--neon-cyan);
	}
	.timestamp,
	.file-size,
	.hash {
		color: var(--text-muted);
	}
	.choose-btn {
		border-color: var(--neon-green);
		color: var(--neon-green);
		font-size: 0.7rem;
		padding: 4px 10px;
	}
	.dismiss-btn {
		margin-top: 8px;
		font-size: 0.7rem;
		color: var(--text-muted);
		border-color: var(--border-color);
	}
	.no-conflicts {
		font-size: 0.8rem;
		color: var(--text-muted);
		text-align: center;
		padding: 40px;
	}
</style>
