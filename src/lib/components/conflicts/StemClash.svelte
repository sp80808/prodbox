<script module lang="ts">
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

	let conflicts: StemConflict[] = $state([]);

	function syncConflicts() {
		const result: StemConflict[] = [];
		yConflicts.forEach((conflict) => {
			result.push({ ...conflict });
		});
		conflicts = result;
	}

	let conflictsObserver: (() => void) | null = null;

	onMount(() => {
		// Seed demo conflicts if empty
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
			// Mark conflict as resolved
			yConflicts.set(stemName, {
				...conflict,
				resolved: true,
				chosenVersionId
			});
			// Set the winning version as the canonical stem
			yStems.set(stemName, chosen);
		});
	}

	function dismissConflict(stemName: string) {
		yConflicts.delete(stemName);
	}

	function formatTimestamp(ts: number): string {
		return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	/** Simulate a new conflict arriving over the P2P pipe */
	function simulateConflict() {
		const stemName = `stem_${uid().slice(0, 4)}.wav`;
		const v1: StemVersion = {
			id: uid(),
			stemName,
			uploadedBy: 'peer-A',
			timestamp: Date.now() - 2000,
			fileSize: `${(Math.random() * 30 + 5).toFixed(1)} MB`,
			hash: uid().slice(0, 8) + '...'
		};
		const v2: StemVersion = {
			id: uid(),
			stemName,
			uploadedBy: 'peer-B',
			timestamp: Date.now(),
			fileSize: `${(Math.random() * 30 + 5).toFixed(1)} MB`,
			hash: uid().slice(0, 8) + '...'
		};
		doc.transact(() => {
			yConflicts.set(stemName, {
				stemName,
				versions: [v1, v2],
				resolved: false,
				chosenVersionId: null
			});
		});
	}
</script>

<div class="stem-clash">
	<div class="clash-header">
		<h3>⚡ Stem Version Clashes</h3>
		<button class="simulate-btn" onclick={simulateConflict}>Simulate Conflict</button>
	</div>

	{#if conflicts.length === 0}
		<div class="no-conflicts">No active conflicts — all stems are in sync.</div>
	{:else}
		<div class="conflict-list">
			{#each conflicts as conflict (conflict.stemName)}
				<div class="conflict-item" class:resolved={conflict.resolved}>
					<div class="conflict-stem-name">
						<span class="stem-icon">{conflict.resolved ? '✅' : '⚠️'}</span>
						<span>{conflict.stemName}</span>
						{#if conflict.resolved}
							<span class="resolved-badge">RESOLVED</span>
						{/if}
					</div>

					{#if !conflict.resolved}
						<div class="versions">
							{#each conflict.versions as version (version.id)}
								<div class="version-row">
									<div class="version-info">
										<span class="version-user">{version.uploadedBy}</span>
										<span class="version-time">{formatTimestamp(version.timestamp)}</span>
										<span class="version-size">{version.fileSize}</span>
										<span class="version-hash">{version.hash}</span>
									</div>
									<button
										class="choose-btn"
										onclick={() => resolveConflict(conflict.stemName, version.id)}
									>
										Keep this version
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<div class="resolved-info">
							Kept version from
							<strong>
								{conflict.versions.find((v) => v.id === conflict.chosenVersionId)?.uploadedBy ??
									'unknown'}
							</strong>
							<button class="dismiss-btn" onclick={() => dismissConflict(conflict.stemName)}>
								Dismiss
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.stem-clash {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
	}
	.clash-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 16px;
		border-bottom: 1px solid var(--border-color);
	}
	.clash-header h3 {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--neon-orange);
	}
	.simulate-btn {
		font-size: 0.7rem;
		border-color: var(--neon-magenta);
		color: var(--neon-magenta);
	}
	.simulate-btn:hover {
		background: var(--neon-magenta);
		color: var(--bg-primary);
	}
	.no-conflicts {
		padding: 24px 16px;
		text-align: center;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.conflict-list {
		display: flex;
		flex-direction: column;
	}
	.conflict-item {
		padding: 14px 16px;
		border-bottom: 1px solid var(--border-color);
	}
	.conflict-item:last-child {
		border-bottom: none;
	}
	.conflict-item.resolved {
		opacity: 0.6;
	}
	.conflict-stem-name {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 10px;
	}
	.stem-icon {
		font-size: 1rem;
	}
	.resolved-badge {
		font-size: 0.6rem;
		background: var(--neon-green);
		color: var(--bg-primary);
		padding: 2px 6px;
		border-radius: 2px;
		font-weight: 700;
	}
	.versions {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.version-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--bg-tertiary);
		padding: 10px 12px;
		border-radius: var(--radius);
		border: 1px solid var(--border-color);
	}
	.version-info {
		display: flex;
		gap: 12px;
		align-items: center;
		font-size: 0.75rem;
	}
	.version-user {
		color: var(--neon-cyan);
		font-weight: 600;
	}
	.version-time {
		color: var(--text-secondary);
	}
	.version-size {
		color: var(--text-muted);
	}
	.version-hash {
		color: var(--text-muted);
		font-size: 0.65rem;
	}
	.choose-btn {
		font-size: 0.7rem;
		border-color: var(--neon-green);
		color: var(--neon-green);
		white-space: nowrap;
	}
	.choose-btn:hover {
		background: var(--neon-green);
		color: var(--bg-primary);
	}
	.resolved-info {
		font-size: 0.8rem;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.resolved-info strong {
		color: var(--neon-cyan);
	}
	.dismiss-btn {
		font-size: 0.65rem;
		border-color: var(--text-muted);
		color: var(--text-muted);
		margin-left: auto;
	}
	.dismiss-btn:hover {
		border-color: var(--neon-red);
		color: var(--neon-red);
	}
</style>
