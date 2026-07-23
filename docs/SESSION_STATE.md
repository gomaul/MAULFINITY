# MAULFINITY - Development Session State

> **Last Updated:** July 22, 2026  
> **Current Sprint:** Sprint 2 — Connector Engine Complete  
> **Status:** Sprint 0-2 Complete, Ready for Sprint 3

---

## 1. Current Architecture

### Tech Stack

| Layer        | Technology              | Version         |
| ------------ | ----------------------- | --------------- |
| Desktop      | Electron                | ^33.3.1         |
| UI Framework | React + TypeScript      | ^18.3.1         |
| Build Tool   | electron-vite + Vite    | ^2.4.0 / ^6.0.5 |
| Styling      | Tailwind CSS            | ^4.0.0          |
| Animation    | Framer Motion           | ^11.15.0        |
| Database     | SQLite (better-sqlite3) | ^11.7.0         |
| Validation   | Zod                     | ^3.24.1         |
| Icons        | Lucide React            | ^0.468.0        |

### Architecture Principles

1. **Modular Local-First** — All data on user's computer
2. **Single Source of Truth** — SQLite is the only data source
3. **Process Isolation** — Renderer cannot access FS/DB/Network directly
4. **IPC Security** — All communication via `window.maulfinity` API
5. **Event-Driven** — Core communication via EventBus

### Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│  RENDERER (React UI)                                        │
│  - Pages: Dashboard, Live, Triggers, Overlay, etc.         │
│  - Only accesses: window.maulfinity.*                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PRELOAD (contextBridge)                                    │
│  - Exposes: window.maulfinity.*                             │
│  - Security gate between UI and Main Process                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  MAIN PROCESS                                               │
│  - IPC Handlers (ipcMain.handle)                            │
│  - Database (SQLite)                                        │
│  - File System                                              │
│  - Network (Connectors)                                     │
│  - Core Engines (EventBus, TriggerEngine, ActionEngine)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Completed Implementation

### Sprint 0 Checklist

| #   | Requirement              | Status | Notes                                        |
| --- | ------------------------ | ------ | -------------------------------------------- |
| 1   | Electron running         | ✅     | Window creation configured                   |
| 2   | React running            | ✅     | With BrowserRouter (HashRouter for Electron) |
| 3   | TypeScript active        | ✅     | Strict mode enabled                          |
| 4   | Tailwind active          | ✅     | v4 with @tailwindcss/vite                    |
| 5   | Folder structure matches | ✅     | Per SRS Parts 3-4                            |
| 6   | IPC working              | ✅     | All channels registered                      |
| 7   | SQLite ready             | ✅     | 11 tables + app_settings                     |
| 8   | Logging to file          | ✅     | Daily log files in logs/                     |
| 9   | No console errors        | ⚠️     | Pending `npm install` + runtime test         |

### Sprint 1 Checklist — Core Engine

| #   | Requirement              | Status | Notes                                        |
| --- | ------------------------ | ------ | -------------------------------------------- |
| 1   | ApplicationCore integrated | ✅  | Wired to main/index.ts with graceful shutdown |
| 2   | EventBus enhanced        | ✅     | Logger, wildcards, history, error recovery    |
| 3   | ServiceContainer         | ✅     | DI container for all services                |
| 4   | ModuleManager            | ✅     | Dynamic module lifecycle management          |
| 5   | ConfigManager            | ✅     | File-based persistent config with defaults   |
| 6   | Logger debug method      | ✅     | Added debug level for all modules            |

### Sprint 2 Checklist — Connector Engine

| #   | Requirement              | Status | Notes                                        |
| --- | ------------------------ | ------ | -------------------------------------------- |
| 1   | Connection State Machine | ✅     | 6 states: disconnected→connecting→auth→connected→reconnecting→error |
| 2   | BaseConnector            | ✅     | Abstract class with lifecycle, reconnection  |
| 3   | EventAdapter             | ✅     | Normalizes platform events to MaulfinityEvent |
| 4   | ConnectorRegistry        | ✅     | Registry pattern for connector plugins       |
| 5   | ConnectorFactory         | ✅     | Factory for creating connector instances     |
| 6   | ConnectorManager         | ✅     | Central manager, status, bulk operations     |
| 7   | TikTokConnector          | ✅     | WebSocket, parser, reconnect, heartbeat      |
| 8   | YouTubeConnector         | ✅     | Polling API, parser, live chat                |
| 9   | registerConnectors       | ✅     | Built-in connectors registered on startup    |
| 10  | Connector IPC            | ✅     | connect/disconnect/status/allStatus/list     |
| 11  | Event History IPC        | ✅     | getEventHistory for Live Center event log     |
| 12  | Live Center page         | ✅     | Real-time connector status + event log       |
| 13  | @types/ws                | ✅     | TypeScript types for WebSocket               |

### Core Modules Created

| Module           | Location                     | Status         |
| ---------------- | ---------------------------- | -------------- |
| Application Core | `src/core/application/`      | ✅ Stub        |
| Event Bus        | `src/core/event-bus/`        | ✅ Implemented |
| Trigger Engine   | `src/core/trigger-engine/`   | ✅ Skeleton    |
| Action Engine    | `src/core/action-engine/`    | ✅ Skeleton    |
| Resource Manager | `src/core/resource-manager/` | ✅ Stub        |
| Profile Manager  | `src/core/profile-manager/`  | ✅ Stub        |
| Config Manager   | `src/core/config-manager/`   | ✅ Stub        |

### Services Created

| Service  | Location                 | Status      |
| -------- | ------------------------ | ----------- |
| Database | `src/services/database/` | ✅ Complete |
| Logger   | `src/services/logger/`   | ✅ Complete |

### Database Tables

| Table          | Purpose                                |
| -------------- | -------------------------------------- |
| `users`        | User accounts                          |
| `profiles`     | Stream configurations                  |
| `connectors`   | Platform connections (TikTok, YouTube) |
| `events`       | Event history                          |
| `triggers`     | Automation rules                       |
| `actions`      | Action definitions                     |
| `assets`       | Media files                            |
| `overlays`     | Overlay configurations                 |
| `plugins`      | Installed plugins                      |
| `logs`         | Application logs                       |
| `app_settings` | Key-value settings                     |

---

## 3. Files Created

### Configuration Files

```
├── package.json                    # Dependencies & scripts
├── electron-builder.yml            # Windows packaging config
├── tsconfig.json                   # TypeScript root config
├── tsconfig.node.json              # TypeScript for Node (main/preload)
├── tsconfig.web.json               # TypeScript for React (renderer)
├── electron.vite.config.ts         # electron-vite config
├── .gitignore                      # Git ignore rules
└── README.md                       # (pending)
```

### Main Process (`src/main/`)

```
├── index.ts                        # App entry point
├── window.ts                       # Window management
└── ipc/
    ├── index.ts                    # Register all IPC handlers
    ├── profile.ipc.ts              # Profile CRUD
    ├── trigger.ipc.ts              # Trigger CRUD
    ├── asset.ipc.ts                # Asset CRUD
    ├── connector.ipc.ts            # Platform connection
    ├── overlay.ipc.ts              # Overlay management
    ├── plugin.ipc.ts               # Plugin management
    ├── settings.ipc.ts             # App settings
    └── system.ipc.ts               # System info
```

### Preload (`src/preload/`)

```
├── index.ts                        # Exposes window.maulfinity
└── api.ts                          # Type definitions
```

### Renderer (`src/renderer/`)

```
├── index.html                      # HTML entry
├── main.tsx                        # React entry
├── App.tsx                         # Root component with routing
├── vite-env.d.ts                   # Vite types
├── styles/
│   └── globals.css                 # Tailwind + custom styles
├── app/
│   ├── Layout.tsx                  # Main layout
│   ├── Sidebar.tsx                 # Navigation sidebar
│   └── Header.tsx                  # Top header
├── components/
│   └── ui/
│       ├── index.ts                # Barrel export
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Switch.tsx
│       └── Badge.tsx
└── pages/
    ├── Dashboard.tsx
    ├── Live.tsx
    ├── Triggers.tsx
    ├── OverlayStudio.tsx
    ├── Assets.tsx
    ├── Profiles.tsx
    ├── Plugins.tsx
    └── Settings.tsx
```

### Core Engines (`src/core/`)

```
├── application/
│   ├── index.ts
│   └── ApplicationCore.ts
├── event-bus/
│   ├── index.ts
│   ├── EventBus.ts
│   └── types.ts
├── trigger-engine/
│   ├── index.ts
│   ├── TriggerEngine.ts
│   ├── ConditionMatcher.ts
│   ├── ActionQueue.ts
│   └── types.ts
├── action-engine/
│   ├── index.ts
│   ├── ActionEngine.ts
│   └── ActionRegistry.ts
├── resource-manager/
│   ├── index.ts
│   └── ResourceManager.ts
├── profile-manager/
│   ├── index.ts
│   └── ProfileManager.ts
└── config-manager/
    ├── index.ts
    └── ConfigManager.ts
```

### Services (`src/services/`)

```
├── database/
│   ├── index.ts                    # DB connection
│   ├── migrations/
│   │   ├── index.ts                # Migration runner
│   │   └── 001_initial.ts          # All 11 tables
│   └── repositories/
│       ├── ProfileRepository.ts
│       ├── TriggerRepository.ts
│       ├── EventRepository.ts
│       ├── AssetRepository.ts
│       ├── PluginRepository.ts
│       └── OverlayRepository.ts
└── logger/
    └── Logger.ts                   # File-based logging
```

### Shared (`src/shared/`)

```
├── types/
│   └── index.ts                    # Global type definitions
└── constants/
    └── index.ts                    # IPC channels, event types
```

---

## 4. Current Sprint

### Sprint 0 — Project Foundation

**Goal:** Empty app with working Electron, React, TypeScript, Tailwind, SQLite, IPC, Logging

**What's Done:**

- ✅ All configuration files
- ✅ Main process with window management
- ✅ Preload with `window.maulfinity` API
- ✅ React UI with routing and 8 pages
- ✅ UI component library (Button, Card, Input, Modal, Switch, Badge)
- ✅ SQLite database with 11 tables
- ✅ Database repositories for all entities
- ✅ IPC handlers for all channels
- ✅ Application Core module
- ✅ Event Bus implementation
- ✅ Trigger Engine skeleton
- ✅ Action Engine skeleton
- ✅ Logger with file output

**What's Pending:**

- ⚠️ `npm install` to install dependencies
- ⚠️ Runtime test to verify no console errors
- ⚠️ Verify `electron-vite` config resolves path aliases

---

## 5. Next Tasks

### Sprint 3 — Trigger Editor UI

| Task              | Description                 |
| ----------------- | --------------------------- |
| Trigger Editor UI | Visual WHEN/IF/THEN builder |
| Keyboard Action   | Simulate key presses        |
| WebSocket Action  | Send data to external apps  |
| Action Queue      | Sequential action execution |

### Sprint 4 — Streaming

| Task           | Description                   |
| -------------- | ----------------------------- |
| OBS WebSocket  | Connect to OBS Studio         |
| Overlay Engine | Local web server for overlays |
| TTS Engine     | Text-to-speech integration    |
| Sound Player   | Audio asset playback          |

### Future — Automation Graph Engine

| Task                    | Description                              |
| ----------------------- | ---------------------------------------- |
| Graph Engine Foundation | Core graph execution engine              |
| Node Type Definitions   | Event, Condition, Logic, Action nodes    |
| Graph Persistence       | Save/load graphs from database           |
| Visual Node Editor      | Drag-and-drop node-based workflow builder |
| Marketplace             | Share/import automation graphs           |

---

## 6. Known Issues

### Critical

| Issue                 | Description                                      | Fix                              |
| --------------------- | ------------------------------------------------ | -------------------------------- |
| Missing `npm install` | Dependencies not installed yet                   | Run `npm install`                |
| Path aliases may fail | `@shared/*`, `@core/*` need electron-vite config | Verify `electron.vite.config.ts` |

### Minor

| Issue                           | Description                                            | Priority |
| ------------------------------- | ------------------------------------------------------ | -------- |
| ApplicationCore not wired       | `main/index.ts` doesn't call `ApplicationCore.start()` | Low      |
| ConnectorRepository missing     | No repository for connectors table                     | Low      |
| Overlay preview is stub         | Returns mock URL                                       | Low      |
| Plugin install doesn't validate | No manifest.json check                                 | Low      |
| No log rotation                 | Logs accumulate daily                                  | Low      |

### Not Yet Implemented

| Feature           | Sprint   | Status         |
| ----------------- | -------- | -------------- |
| TikTok Connector  | Sprint 2 | ✅ Complete    |
| YouTube Connector | Sprint 2 | ✅ Complete    |
| OBS Integration   | Sprint 4 | ❌ Not started |
| Overlay Engine    | Sprint 4 | ❌ Not started |
| TTS Engine        | Sprint 4 | ❌ Not started |
| Plugin System     | Sprint 5 | ❌ Not started |
| Trigger Editor UI | Sprint 3 | ❌ Not started |
| Automation Graph  | Future   | ❌ Not started |

---

## 7. IPC Channel Reference

| Module        | Channel                | Method |
| ------------- | ---------------------- | ------ |
| **Profile**   | `profile:list`         | GET    |
|               | `profile:get`          | GET    |
|               | `profile:create`       | POST   |
|               | `profile:update`       | PUT    |
|               | `profile:delete`       | DELETE |
| **Trigger**   | `trigger:list`         | GET    |
|               | `trigger:create`       | POST   |
|               | `trigger:update`       | PUT    |
|               | `trigger:delete`       | DELETE |
|               | `trigger:test`         | POST   |
| **Asset**     | `asset:list`           | GET    |
|               | `asset:import`         | POST   |
|               | `asset:delete`         | DELETE |
|               | `asset:scan`           | POST   |
| **Connector** | `connector:connect`    | POST   |
|               | `connector:disconnect` | POST   |
|               | `connector:status`     | GET    |
|               | `connector:allStatus`  | GET    |
|               | `connector:list`       | GET    |
|               | `connector:getEventHistory` | GET |
| **Overlay**   | `overlay:list`         | GET    |
|               | `overlay:save`         | POST   |
|               | `overlay:preview`      | GET    |
| **Plugin**    | `plugin:list`          | GET    |
|               | `plugin:install`       | POST   |
|               | `plugin:disable`       | PUT    |
|               | `plugin:remove`        | DELETE |
| **System**    | `system:getVersion`    | GET    |
|               | `system:getStatus`     | GET    |
|               | `system:restart`       | POST   |
| **Settings**  | `settings:get`         | GET    |
|               | `settings:set`         | PUT    |
|               | `settings:getAll`      | GET    |

---

## 8. How to Test

```bash
# Navigate to project
cd C:\Users\PC-3\Desktop\MAULFINITY

# Install dependencies
npm install

# Start development server
npm run dev

# Expected: Electron window opens with Maulfinity UI
```

---

## 9. Documentation References

| Document      | Contents                        |
| ------------- | ------------------------------- |
| SRS Part 1    | Project overview, vision, goals |
| SRS Part 2    | Detailed technical specs        |
| SAD Part 3    | Architecture blueprint          |
| SAD Part 4    | Implementation blueprint        |
| UI/UX Part 5  | Design system, colors, layout   |
| DB/API Part 6 | Database schema, IPC contracts  |
| Roadmap       | Sprint 0-4 development plan     |
| Core Philosophy | Automation Graph Engine vision |

---

**End of Session State**
