/**
 * Tauri filesystem helpers.
 *
 * Wraps the Tauri plugin-fs and plugin-dialog APIs to:
 *  - Prompt the user to choose a destination DAW folder (one-time).
 *  - Persist the chosen path via the persisted-scope plugin so future launches
 *    do not require re-prompting.
 *  - Auto-drop incoming stems directly into the configured folder.
 */

/** Invoke only in desktop context — guard with isTauri() before calling. */
export function isTauri(): boolean {
	return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Ask the user to pick their DAW import folder and persist the scope.
 * Returns the chosen path or null if cancelled.
 */
export async function pickAndPersistDawFolder(): Promise<string | null> {
	if (!isTauri()) return null;

	const { open }     = await import('@tauri-apps/plugin-dialog');
	const { appDataDir } = await import('@tauri-apps/api/path');

	const selected = await open({ directory: true, multiple: false, title: 'Select DAW Import Folder' });
	if (!selected || typeof selected !== 'string') return null;

	// Persist scope so Tauri grants access on future launches without re-prompting.
	// The `@tauri-apps/plugin-persisted-scope` package does not currently ship a
	// complete TypeScript declaration for `allowPath` at the module level, so we
	// cast to `unknown` first to satisfy strict mode without masking other errors.
	const { PersistedScope } = await import('@tauri-apps/plugin-persisted-scope');
	await (PersistedScope as unknown as { allowPath(p: string): Promise<void> }).allowPath(selected);

	return selected;
}

/**
 * Write binary data (an audio stem) directly into the configured DAW folder.
 */
export async function dropStemToFolder(
	folderPath: string,
	fileName: string,
	data: Uint8Array
): Promise<void> {
	if (!isTauri()) throw new Error('dropStemToFolder requires the Tauri desktop context.');

	const { writeFile } = await import('@tauri-apps/plugin-fs');
	const { join }      = await import('@tauri-apps/api/path');

	const destPath = await join(folderPath, fileName);
	await writeFile(destPath, data);
}
