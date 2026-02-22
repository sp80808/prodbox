# Prod Box — Copilot Instructions

You are the AI pair-programmer for **Prod Box** — a desktop-first, peer-to-peer audio collaboration tool. These rules are mandatory. Do not deviate.

---

## Tech Stack (Locked — Do Not Change)

| Layer | Technology | Version |
|---|---|---|
| Desktop shell | Tauri | v2 |
| Frontend framework | SvelteKit | v2 |
| Styling | Tailwind CSS | v3 |
| Language | TypeScript | strict mode |
| P2P transport | WebRTC DataChannels | Web API |
| Collaborative state | Yjs + y-webrtc | latest |
| Backend / signalling | Supabase | v2 JS client |
| DAW parsers | Python 3.11+ sidecars (PyInstaller) | — |
| Rust (Tauri core) | Rust stable | latest stable |

**Do not suggest or introduce:** React, Vue, Angular, Next.js, Nuxt, Remix, Express, Fastify, Prisma, tRPC, GraphQL, REST frameworks, Docker, Kubernetes, or any enterprise-scale tooling.

---

## Architecture Constraints

1. **Desktop-first.** The app runs as a Tauri binary. SSR is disabled (`export const ssr = false`). The SvelteKit adapter is `@sveltejs/adapter-static` outputting to `build/`.

2. **P2P transport only for files.** Audio stems are **never** uploaded to Supabase Storage or any server. They travel via `RTCDataChannel` with 64 KB chunks and backpressure control (`bufferedAmount` checks).

3. **Supabase is for signalling and metadata only.** Permitted tables: `users`, `projects`, `project_members`, `stems`, `stem_versions`, `tasks`, `events`. Do not add tables for binary data. Do not use Supabase Storage.

4. **Tauri filesystem access is capability-scoped.** All filesystem operations must go through `@tauri-apps/plugin-fs`. Paths must be granted via `@tauri-apps/plugin-persisted-scope` before use. Never use `window.showOpenFilePicker` or other browser File System Access APIs — they do not have the permissions Tauri needs.

5. **Python sidecars for DAW parsing.** Parsing `.als` (Ableton) and `.logicx` (Logic Pro) files is done by bundled Python executables — not in the browser, not in Rust. The sidecar communicates via stdout JSON.

6. **Yjs for collaborative state.** Shared Kanban boards, tasks, and project timelines use `Y.Array` and `Y.Map` with `WebrtcProvider`. Do not introduce a separate real-time state solution.

---

## "Tactile Dark" UI Rules (Mandatory)

### Colours

```
Background range:  #121212 (charcoal-900) → #1E1E1E (charcoal-600)
Surface:           #1E1E1E → #2E2E2E
Border / divider:  #3A3A3A (charcoal-300)
Primary accent:    #00BFFF (neon-blue)
Warning accent:    #D4FF00 (neon-yellow)
Success accent:    #39FF14 (neon-green)
Error / danger:    #FF3B3B (neon-red)
Body text:         #FFFFFF (primary), #A0A0A0 (secondary / muted)
```

**Never use pure `#000000` as a background.** Always use charcoal-900 (`#121212`) or darker charcoal variants.

### Typography

- **Headers / display text:** `font-display` → Space Grotesk, bold/black weight. Tight tracking.
- **Body text:** `font-sans` → Inter.
- **Timestamps, file sizes, byte counts, metadata:** `font-mono` → JetBrains Mono.

### Component Rules

- Cards use `bg-charcoal-600 border border-charcoal-400 rounded-lg` — not white/light backgrounds.
- Buttons use `btn-primary` (neon-blue) or a plain bordered secondary style — not full-width gradient blobs.
- No animations longer than 150ms. No bounce, spring, or playful easing. Motion should be sharp and utilitarian.
- No skeleton loaders with shimmer effects. Use minimal opacity pulses if needed.
- No hero images, illustrations, or stock photography in the UI.
- No light mode. Do not add a theme toggle.

---

## Code Style Rules

1. **TypeScript strict mode always.** No `any` unless unavoidable (add `// eslint-disable-line` comment explaining why).
2. **Svelte components:** Logic in `<script lang="ts">`, styles via Tailwind utility classes, no `<style>` blocks unless a Tailwind utility genuinely cannot achieve the result.
3. **Rust:** Follow `rustfmt` defaults. Use `thiserror` for error types. No `unwrap()` in production paths — use `?` or explicit error handling.
4. **Python sidecars:** Type-annotated. No third-party runtime dependencies beyond stdlib (PyInstaller is a build tool, not a runtime dep). Output must always be a single JSON object to stdout.
5. **No `console.log` in committed code.** Use structured logging or Tauri's `log` plugin.
6. **Imports:** Absolute imports via `$lib/` alias for SvelteKit. No relative `../../` chains beyond one level.

---

## What to Never Do

- **Do not add Supabase Storage** calls or any server-side file hosting.
- **Do not add a backend Node.js / Bun / Deno server.** The only "backend" is Supabase (managed).
- **Do not introduce CSS-in-JS libraries** (styled-components, Emotion, Stitches).
- **Do not add a component library** (shadcn, DaisyUI, Mantine, Chakra, Material UI, Ant Design, etc.). Build from Tailwind primitives only.
- **Do not add Redux, Zustand, Jotai, Pinia, or any external state manager.** Use Svelte stores and Yjs.
- **Do not use `fetch` to transfer audio data.** WebRTC DataChannels only.
- **Do not add bloated utility libraries** (lodash, moment.js, date-fns for simple formatting, ramda). Use modern JS/TS builtins.
- **Do not add a testing framework** unless explicitly asked. If asked, use Vitest for unit tests and Playwright for e2e.

---

## File Location Reference

```
src/lib/webrtc/        — WebRTC transfer logic
src/lib/stores/        — Svelte stores and Yjs collaborative state
src/lib/utils/         — Tauri filesystem helpers, formatting utilities
src/lib/components/    — Svelte UI components (kanban/, stems/, ui/)
src/routes/            — SvelteKit pages and layouts
src-tauri/src/         — Rust: lib.rs (commands), main.rs (entry)
src-tauri/capabilities/ — Tauri capability JSON files
python-sidecars/       — DAW parser Python scripts + PyInstaller specs
```

---

## Tone

This is a tool built by producers, for producers. Code should be precise, lean, and opinionated. Comments should be concise and technical — not tutorial-style explanations. If a function is longer than 60 lines, it should probably be split. If a component is longer than 200 lines, it definitely should be.
