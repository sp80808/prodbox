# 🎛️ Prod Box

![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri_v2-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![Yjs](https://img.shields.io/badge/Yjs_CRDT-FF9900?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

Three WhatsApp groups, random Discord pings at 2am, and expired Google Drive links. The current state of remote music collaboration is absolute chaos. 

**Prod Box** is the conductor's baton that makes the pubs irrelevant. It's a desktop-first, peer-to-peer audio collaboration hub designed for zero-latency workflows and massive audio stem transfers. No server storage costs. No forced cloud ecosystems. Just a direct, encrypted pipe from your mate's hard drive straight into your DAW.

## 🔥 The Engine Room

We aren't building another bloated enterprise tool. We're building a hyper-optimised, local-first powerhouse. 

* **The Titanium Pipe (P2P):** 500MB+ `.wav` files fly strictly peer-to-peer via WebRTC DataChannels. Built with strict 64KB chunking and `bufferedAmount` backpressure so your browser doesn't choke and crash on a flaky Wi-Fi connection.
* **Ghost Drops:** Thanks to Tauri v2's `persisted-scope` plugin, you authorise your DAW folder *once*. After that, incoming stems drop silently into your Ableton or Logic folder in the background. Zero friction.
* **DAW Black Magic:** Embedded Python sidecars parse `.als` (Ableton) and `.logicx` (Logic Pro) project files locally. Drag a project in, and the app instantly extracts missing sample paths, MIDI clips, and arrangement markers.
* **Local-First State:** The Kanban board and stem versioning timelines are powered by Yjs (CRDTs). It works offline and synchronises seamlessly over the WebRTC pipe the second you reconnect.
* **Discord Integration:** Automated webhooks fire the second a new vocal take drops. 

## 🏗️ The Tech Stack

* **Frontend:** SvelteKit (strictly minimalist) styled with Tailwind CSS.
* **Desktop Shell:** Tauri v2 (Rust) for deep OS integration and file system access.
* **Transport:** WebRTC DataChannels.
* **State Management:** Yjs (CRDTs) tied directly to the UI.
* **Backend / Signalling:** Supabase (Postgres, Auth, Realtime). We only store metadata. 
* **Parsers:** Python executables wrapped as Tauri sidecars (`dawtool`, `logicx-analyzer`).

## 🎨 Design Language: "Tactile Dark"

The UI feels like a piece of studio hardware. Deep charcoal greys (`#121212` to `#1E1E1E`). No pure black. High-contrast neon accents—electric blue and toxic yellow. We use brutalist sans-serif for headers and `JetBrains Mono` for all timestamps, file sizes, and metadata.

## 🚀 Getting Started

You need Node.js, Rust, and the standard Tauri v2 build dependencies installed on your machine.

**1. Clone the repo & install dependencies**
```bash
git clone [https://github.com/yourusername/prod-box.git](https://github.com/yourusername/prod-box.git)
cd prod-box
npm install
