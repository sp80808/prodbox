# Prod Box

> **Discord meets Pro DAW sync.** A desktop-first, peer-to-peer audio collaboration hub built for producers who refuse to compromise on latency, file size, or workflow.

[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri&logoColor=white)](https://tauri.app)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Vision

Most collaboration tools are built for the browser — they treat audio files as blobs to upload, store, and stream from a central server. That is fine for sharing a Spotify link. It is catastrophic for transferring a 500 MB stem session at 2 AM when you are mid-flow.

**Prod Box is different:**

- Files travel **peer-to-peer** (WebRTC DataChannels). Your 500 MB Ableton session goes directly from your machine to your collaborator's machine. No cloud middleman. No storage bill.
- The app is a **native desktop binary** (Tauri/Rust shell) that can write audio files directly into your DAW's import folder the moment they arrive — no manual dragging.
- Collaborative state (Kanban boards, tasks, project timelines) is synced via **Yjs CRDTs over WebRTC** — offline-first and conflict-free.
- Supabase handles only **signalling and project metadata** (user IDs, project names, WebRTC offer/answer exchange). Zero media storage costs.

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Desktop Shell | Tauri v2 (Rust) | Native binary, filesystem access, sidecar bundling |
| Frontend | SvelteKit + TypeScript | UI, routing, state |
| Styling | Tailwind CSS (Tactile Dark theme) | Design system |
| P2P Transport | WebRTC DataChannels | Chunked binary stem transfers (64 KB chunks) |
| Collaborative State | Yjs + y-webrtc | Offline-first CRDT Kanban, tasks, timeline |
| Backend / Signalling | Supabase (Postgres + Realtime) | Auth, project metadata, WebRTC signalling only |
| DAW Parsers | Python sidecars (PyInstaller) | Parse `.als` (Ableton) and `.logicx` (Logic Pro) locally |

---

## Design Language: "Tactile Dark"

Prod Box uses a bespoke dark UI language designed to feel at home alongside any DAW:

- **Background palette:** Deep charcoal greys — `#121212` → `#1E1E1E`. Never pure black.
- **Accent colours:** Electric blue (`#00BFFF`) and toxic yellow (`#D4FF00`).
- **Typography:** Space Grotesk for headers (brutalist weight), JetBrains Mono for timestamps and file metadata.
- **No enterprise patterns:** No rounded-everything cards, no pastel colours, no giant hero images. Every pixel earns its place.

---

## Repository Structure

```
prodbox/
├── src/                          # SvelteKit frontend
│   ├── app.html                  # HTML shell (Tailwind dark background)
│   ├── app.css                   # Tactile Dark base styles + Tailwind imports
│   ├── routes/
│   │   ├── +layout.svelte        # Root layout
│   │   └── +page.svelte          # Landing / dashboard
│   └── lib/
│       ├── supabase.ts           # Supabase client (signalling + metadata only)
│       ├── stores/
│       │   └── collaboration.ts  # Yjs CRDT document + y-webrtc provider
│       ├── webrtc/
│       │   └── transfer.ts       # 64 KB chunked file transfer with backpressure
│       └── utils/
│           └── tauri-fs.ts       # Tauri filesystem helpers + persisted-scope
├── src-tauri/                    # Tauri Rust application
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   └── lib.rs                # Plugin registration + Tauri commands
│   ├── capabilities/
│   │   └── default.json          # Explicit window capability grants
│   ├── Cargo.toml
│   └── tauri.conf.json           # App config, bundle targets, CSP
├── python-sidecars/              # DAW project file parsers
│   ├── als_parser/
│   │   ├── parser.py             # Ableton .als (gzip XML) parser
│   │   └── requirements.txt
│   └── logicx_parser/
│       ├── parser.py             # Logic Pro .logicx (plist) parser
│       └── requirements.txt
├── static/                       # Static assets (favicon, etc.)
├── .github/
│   └── copilot-instructions.md   # Copilot workspace constraints
├── ARCHITECTURE.md               # Deep-dive: P2P flow, DB schema, Tauri permissions
├── package.json
├── svelte.config.js
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## Local Development Setup

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20 | [nodejs.org](https://nodejs.org) |
| Rust + Cargo | stable | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` (see [rustup.rs](https://rustup.rs)) |
| Python | ≥ 3.11 | [python.org](https://python.org) |
| Tauri CLI | v2 | included in `devDependencies` |

**macOS additional deps:**
```bash
xcode-select --install
```

**Linux additional deps:**
```bash
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

### 1. Clone & Install

```bash
git clone https://github.com/sp80808/prodbox.git
cd prodbox
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Run in Development Mode

```bash
npm run tauri dev
```

This starts the Vite dev server on `localhost:1420` and the Tauri desktop window simultaneously. Hot-module replacement works for the SvelteKit frontend.

### 4. Build for Production

```bash
npm run tauri build
```

Outputs a native installer in `src-tauri/target/release/bundle/`.

### 5. Build Python Sidecars (optional, for DAW parsing)

```bash
cd python-sidecars/als_parser
pip install -r requirements.txt
pyinstaller --onefile --name als_parser parser.py

cd ../logicx_parser
pip install -r requirements.txt
pyinstaller --onefile --name logicx_parser parser.py
```

The resulting binaries are picked up by Tauri's `bundle.resources` config.

---

## Core Philosophy

1. **Peer-to-peer by default.** If data can travel directly between two machines, it should. The server exists to introduce strangers, not to sit between friends.
2. **Zero server storage costs.** Supabase stores rows, not files. Audio never touches our infrastructure.
3. **Desktop-first, browser-optional.** The native shell unlocks filesystem access, sidecar execution, and system tray integration that a browser tab will never have.
4. **Lean dependencies.** Every `npm install` is a liability. If a built-in Web API or Rust crate can do the job, use it.
5. **Offline-capable.** Yjs CRDTs mean your Kanban board and task list keep working on a plane. They sync when peers reconnect.

---

## Contributing

Please read [ARCHITECTURE.md](ARCHITECTURE.md) before opening a PR. Understand the P2P data flow, the Tauri permission model, and the Tactile Dark design rules before touching any UI components.

---

## License

MIT © Prod Box Contributors