# Prod Box — Architecture

This document is the authoritative reference for Prod Box's internal design. Read it before making architectural decisions.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [P2P WebRTC Data Flow](#p2p-webrtc-data-flow)
3. [Tauri Filesystem Permission Strategy](#tauri-filesystem-permission-strategy)
4. [Supabase Database Schema](#supabase-database-schema)
5. [Discord Webhook Integration](#discord-webhook-integration)
6. [DAW Sidecar Architecture](#daw-sidecar-architecture)
7. [Yjs Collaborative State](#yjs-collaborative-state)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Prod Box Desktop App                        │
│  ┌──────────────────────┐   ┌──────────────────────────────┐   │
│  │   SvelteKit UI        │   │      Tauri (Rust) Shell      │   │
│  │  (Tailwind / Tactile) │   │  - fs plugin                 │   │
│  │  - Project dashboard  │   │  - dialog plugin             │   │
│  │  - Kanban board       │   │  - persisted-scope plugin    │   │
│  │  - Stem transfer UI   │   │  - shell plugin (sidecars)   │   │
│  └──────────┬───────────┘   └──────────────────────────────┘   │
│             │ Tauri IPC (invoke / event)                        │
│             └─────────────────────────────────────────────────  │
└─────────────────────────────────────────────────────────────────┘
         │                                    │
         │ HTTPS / WSS                        │ WebRTC (direct)
         ▼                                    ▼
┌─────────────────┐                 ┌─────────────────────┐
│   Supabase       │                 │  Remote Peer's       │
│  - Auth          │                 │  Prod Box Instance   │
│  - Realtime      │◄───signalling──►│                     │
│  - Postgres      │                 └─────────────────────┘
│  (metadata only) │
└─────────────────┘
```

---

## P2P WebRTC Data Flow

### Signalling (via Supabase Realtime)

1. **Initiator** creates an `RTCPeerConnection`, generates an SDP offer, and writes it to the `events` table in Supabase with `type = 'webrtc_offer'`.
2. **Responder** receives the offer via a Supabase Realtime subscription, creates its own `RTCPeerConnection`, generates an SDP answer, and writes it back with `type = 'webrtc_answer'`.
3. Both peers exchange ICE candidates through `type = 'ice_candidate'` events in the same table.
4. Once both sides have valid remote descriptions and ICE candidates, the `RTCPeerConnection` reaches the `connected` state.

### File Transfer (DataChannel)

```
Initiator                                    Responder
    │                                             │
    │──── RTCDataChannel.send(JSON control) ─────►│  { type: 'start', meta: { fileName, size, checksum } }
    │                                             │
    │──── ArrayBuffer chunk 0 (64 KB) ───────────►│
    │──── ArrayBuffer chunk 1 (64 KB) ───────────►│
    │  (backpressure check: bufferedAmount > 16MB)│
    │  (pause sending, wait for drain event)      │
    │──── ArrayBuffer chunk N ───────────────────►│
    │                                             │
    │──── RTCDataChannel.send(JSON control) ─────►│  { type: 'complete', transferId }
    │                                             │
    │                                 Responder verifies SHA-256 checksum
    │                                 Responder calls dropStemToFolder()
    │                                 Tauri writes file to DAW import folder
```

### Backpressure

- Sending is paused when `channel.bufferedAmount > 16 MB` (high watermark).
- Sending resumes when `channel.bufferedAmount < 4 MB` (low watermark).
- This prevents memory exhaustion on slow connections when transferring 500 MB+ stems.

### Resume / Retry

- Each transfer has a UUID (`transferId`).
- The receiver acknowledges the last successfully received chunk index.
- On reconnect, the initiator resumes from `lastAckedChunk + 1`.

---

## Tauri Filesystem Permission Strategy

Tauri v2 uses a **capability-based permission system**. No filesystem access is granted by default.

### Capability Configuration (`src-tauri/capabilities/default.json`)

Explicit permissions granted:

| Permission | Purpose |
|---|---|
| `fs:allow-read-text-file` | Read DAW project files for sidecar parsing |
| `fs:allow-write-file` | Write incoming audio stems to DAW folder |
| `fs:allow-exists` | Check if destination path exists before writing |
| `fs:allow-create-dir` | Create sub-directories in DAW folder if needed |
| `dialog:allow-open` | Show folder picker for DAW import path selection |
| `persisted-scope:default` | Persist granted folder paths across app restarts |

### Persisted Scope Flow

```
First launch:
  User clicks "Set DAW Folder"
    → dialog:allow-open shows native folder picker
    → User selects ~/Music/Ableton/Imports
    → persisted-scope saves this path to disk
    → Tauri grants fs access to this path for all future launches

Subsequent launches:
  persisted-scope restores the saved grant automatically
  No re-prompting required
```

The persisted scope data is stored in the platform app data directory (`~/Library/Application Support/com.prodbox.app/` on macOS).

---

## Supabase Database Schema

Supabase stores **project metadata and signalling data only**. No audio files are stored.

### Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key (Supabase Auth user ID) |
| `username` | `text` | Unique display name |
| `avatar_url` | `text` | Optional avatar URL |
| `discord_webhook_url` | `text` | Encrypted; used for project notifications |
| `created_at` | `timestamptz` | Default: `now()` |

#### `projects`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `owner_id` | `uuid` | FK → `users.id` |
| `name` | `text` | Project display name |
| `bpm` | `numeric(5,2)` | Nullable |
| `key` | `text` | Musical key (e.g. `"Am"`) |
| `daw` | `text` | DAW type: `"ableton"` \| `"logic"` \| `"other"` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

#### `project_members`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `project_id` | `uuid` | FK → `projects.id` |
| `user_id` | `uuid` | FK → `users.id` |
| `role` | `text` | `"owner"` \| `"collaborator"` \| `"viewer"` |
| `joined_at` | `timestamptz` | |

#### `stems`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `project_id` | `uuid` | FK → `projects.id` |
| `uploaded_by` | `uuid` | FK → `users.id` |
| `name` | `text` | Track/stem name |
| `file_name` | `text` | Original filename |
| `file_size` | `bigint` | Bytes |
| `mime_type` | `text` | e.g. `"audio/wav"` |
| `checksum_sha256` | `text` | Integrity verification |
| `created_at` | `timestamptz` | |

#### `stem_versions`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `stem_id` | `uuid` | FK → `stems.id` |
| `version_number` | `integer` | Auto-incremented per stem |
| `uploaded_by` | `uuid` | FK → `users.id` |
| `change_notes` | `text` | Optional producer notes |
| `file_name` | `text` | Versioned filename |
| `file_size` | `bigint` | |
| `checksum_sha256` | `text` | |
| `created_at` | `timestamptz` | |

#### `tasks`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `project_id` | `uuid` | FK → `projects.id` |
| `created_by` | `uuid` | FK → `users.id` |
| `assigned_to` | `uuid` | FK → `users.id`, nullable |
| `title` | `text` | |
| `description` | `text` | Nullable |
| `status` | `text` | `"todo"` \| `"in_progress"` \| `"done"` |
| `priority` | `text` | `"low"` \| `"medium"` \| `"high"` |
| `due_date` | `date` | Nullable |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

#### `events`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `project_id` | `uuid` | FK → `projects.id` |
| `from_user_id` | `uuid` | FK → `users.id` |
| `to_user_id` | `uuid` | FK → `users.id`, nullable (broadcast = null) |
| `type` | `text` | `"webrtc_offer"` \| `"webrtc_answer"` \| `"ice_candidate"` \| `"chat"` \| `"notification"` |
| `payload` | `jsonb` | SDP offer/answer, ICE candidate, or message body |
| `created_at` | `timestamptz` | Default: `now()` |
| `expires_at` | `timestamptz` | Signalling rows are short-lived (TTL ~60s) |

### Row-Level Security

Every table has RLS enabled. Core policy patterns:

- `users` — Users can only read/write their own row.
- `projects` — Readable by `project_members`; writable by `owner`.
- `project_members` — Readable by project members; owner can insert/delete.
- `stems` / `stem_versions` / `tasks` — Readable and writable by project members.
- `events` — Insertable by authenticated users; readable only by `to_user_id` or by members of `project_id`.

---

## Discord Webhook Integration

When a notable project event occurs (new stem uploaded, task status changed, collaborator joined), Prod Box sends a formatted notification to the project owner's Discord webhook.

### Trigger Points

| Event | Trigger Location | Webhook Field |
|---|---|---|
| Stem transfer complete | Responder's `transfer.ts` | `users.discord_webhook_url` |
| New collaborator joined | `project_members` Supabase trigger | Project owner's webhook |
| Task moved to `done` | Kanban board component | Project owner's webhook |

### Payload Format

```json
{
  "username": "Prod Box",
  "avatar_url": "https://prodbox.app/icon.png",
  "embeds": [
    {
      "title": "🎛️ New Stem Received",
      "color": 48895,
      "fields": [
        { "name": "Project",   "value": "Late Night Sessions", "inline": true },
        { "name": "Stem",      "value": "Bass_v3.wav",         "inline": true },
        { "name": "Size",      "value": "487 MB",              "inline": true },
        { "name": "From",      "value": "producer_x",          "inline": true }
      ],
      "footer": { "text": "Prod Box • peer-to-peer" },
      "timestamp": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

Webhooks are fired from the **client side** (Tauri app) using `fetch()` — no server-side function required. The webhook URL is stored encrypted in `users.discord_webhook_url` and never logged.

---

## DAW Sidecar Architecture

```
Tauri App (Rust)
  │
  │ shell plugin: spawn process
  ▼
als_parser (PyInstaller binary)
  │
  │ reads file from local disk (granted by persisted-scope)
  ▼
Gzip-decompress → parse XML → extract tracks, BPM, version
  │
  │ JSON to stdout
  ▼
Tauri command handler → forward to SvelteKit UI as event
```

### Build Process

1. Python source → PyInstaller `--onefile` binary.
2. Binary placed in `python-sidecars/{parser}/dist/`.
3. Tauri's `bundle.resources` copies the binary into the app bundle at build time.
4. Tauri `externalBin` registers the binary so the shell plugin can spawn it.
5. At runtime: `Command.sidecar('sidecars/als_parser').args([filePath]).output()`.

---

## Yjs Collaborative State

```
Peer A                           Peer B
  │                                │
  │  Y.Doc (local)                 │  Y.Doc (local)
  │  tasks: Y.Array                │  tasks: Y.Array
  │  stems: Y.Array                │  stems: Y.Array
  │  timeline: Y.Map               │  timeline: Y.Map
  │                                │
  │◄─── y-webrtc sync updates ────►│
  │  (Yjs CRDT merge — no conflicts)│
  │                                │
  │  awareness: cursor position,   │
  │  online status, active track   │
```

- **Offline-first:** Changes made while disconnected are queued and merged automatically when the peer reconnects.
- **No operational transforms:** Yjs uses CRDTs — merge is always correct regardless of order.
- **Awareness:** Each peer broadcasts lightweight ephemeral state (cursor, selected track, online status) using the Yjs Awareness protocol. This is NOT persisted.
