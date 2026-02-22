# Prod Box

Zero-latency, peer-to-peer audio collaboration hub. Local-first, offline-capable, CRDT-powered.

Built with **SvelteKit**, **Yjs**, **wavesurfer.js**, and the "Tactile Dark" design language (deep greys, neon accents, JetBrains Mono).

## Features

### Yjs Kanban Board (`/kanban`)
Drag-and-drop task management backed by Yjs CRDTs. Each column is a separate `Y.Array` for independent CRDT merging. Card moves are wrapped in `doc.transact()` for atomic cross-column operations. All changes are local-first and sync automatically when peers connect.

### Offline Waveform Viewer (`/waveform`)
Load a local `.wav` (or `.mp3`/`.ogg`/`.flac`) file and render a zoomable waveform entirely on the client via the Web Audio API and wavesurfer.js. No server upload required — files are read via `FileReader` → `Blob` → `ObjectURL`.

### Stem Version Clash Resolution (`/conflicts`)
When two peers upload the same stem simultaneously over the P2P pipe, Yjs detects the conflict via its `Y.Map` structure. The project owner can inspect both versions (uploader, timestamp, file size, hash) and choose which to keep. Resolved conflicts can be dismissed.

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run check` | TypeScript + Svelte type checking |
| `npm run test` | Run unit tests (vitest) |

## Tech Stack

- **SvelteKit** — Framework
- **Yjs** — CRDT library for local-first collaboration
- **wavesurfer.js** — Client-side audio waveform rendering
- **@atlaskit/pragmatic-drag-and-drop** — Drag-and-drop primitives (available for future integration)
