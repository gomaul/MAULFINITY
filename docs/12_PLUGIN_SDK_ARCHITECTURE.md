# MAULFINITY — PLUGIN SDK ARCHITECTURE

> Version 1.0 | July 23, 2026
> Status: Architecture Design (No Implementation)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Plugin SDK Architecture](#2-plugin-sdk-architecture)
3. [Plugin Lifecycle](#3-plugin-lifecycle)
4. [Plugin Manager Design](#4-plugin-manager-design)
5. [Plugin Manifest Format](#5-plugin-manifest-format)
6. [Plugin API Design](#6-plugin-api-design)
7. [Plugin Sandbox Security](#7-plugin-sandbox-security)
8. [Plugin Communication Flow](#8-plugin-communication-flow)
9. [Custom Node Architecture](#9-custom-node-architecture)
10. [Custom Overlay Widget Architecture](#10-custom-overlay-widget-architecture)
11. [Plugin Storage](#11-plugin-storage)
12. [Version Compatibility](#12-version-compatibility)
13. [Marketplace Preparation](#13-marketplace-preparation)
14. [Developer Experience](#14-developer-experience)
15. [Future Roadmap](#15-future-roadmap)

---

## 1. Executive Summary

Maulfinity will transform from a closed application into an **extensible automation platform** through the Plugin SDK.

### Vision

External developers can extend Maulfinity with:

| Extension Type | Description | Example |
|----------------|-------------|---------|
| **Custom Connectors** | New platform integrations | Twitch, Kick, Trovo |
| **Custom Automation Nodes** | New graph nodes | AI Decision, Weather API |
| **Custom Game Adapters** | New game integrations | Valorant, Fortnite |
| **Custom Overlay Widgets** | New overlay elements | Chat Box, Donation Ticker |
| **Custom Actions** | New action types | Discord Webhook, HTTP Request |
| **Custom Tools** | Developer utilities | Debug Console, Profiler |

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Independent Layer** | Plugin SDK exists as separate module, does not modify core |
| **Sandboxed Execution** | Plugins run in isolated context with limited permissions |
| **Permission-Based** | Plugins declare required permissions, users approve |
| **Versioned APIs** | SDK uses semantic versioning with compatibility guarantees |
| **Marketplace-Ready** | Plugin format supports discovery, installation, updates |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      MAULFINITY CORE                             │
│                                                                  │
│  Event Bus │ Trigger Engine │ Automation Engine │ Action Engine  │
│            │ Graph Engine   │                   │                │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PLUGIN MANAGER  │
                    │  (Lifecycle Mgmt) │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  PLUGIN SANDBOX   │
                    │  (Isolation)      │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PLUGIN SDK API  │
                    │  (Public API)     │
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
    │ Plugin A  │      │ Plugin B  │      │ Plugin C  │
    │ (Twitch)  │      │ (AI Chat) │      │ (Custom)  │
    └───────────┘      └───────────┘      └───────────┘
```

---

## 2. Plugin SDK Architecture

### 2.1 Layer Separation

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAULFINITY CORE (DO NOT MODIFY)               │
│                                                                  │
│  EventBus │ TriggerEngine │ GraphEngine │ ActionEngine │ OBS     │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PLUGIN MANAGER  │ ← Handles lifecycle
                    │   PluginManager   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  PLUGIN RUNTIME   │ ← Executes plugins
                    │   PluginRuntime   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  PLUGIN SANDBOX   │ ← Enforces permissions
                    │   PluginSandbox   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PLUGIN SDK API  │ ← Public interface
                    │   MaulfinitySDK   │
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
    │  Connector │      │   Node    │      │  Widget   │
    │   Plugin   │      │  Plugin   │      │  Plugin   │
    └───────────┘      └───────────┘      └───────────┘
```

### 2.2 Component Responsibilities

| Component | Responsibility | Location |
|-----------|---------------|----------|
| **PluginManager** | Lifecycle management, discovery, validation | `src/plugins/manager/` |
| **PluginRuntime** | Plugin execution, loading, unloading | `src/plugins/runtime/` |
| **PluginSandbox** | Permission enforcement, isolation | `src/plugins/sandbox/` |
| **PluginSDK** | Public API for plugin developers | `src/plugins/sdk/` |
| **PluginRegistry** | Loaded plugin tracking | `src/plugins/registry/` |

### 2.3 Independence Guarantee

The Plugin SDK:

- **DOES NOT** modify Event Bus
- **DOES NOT** modify Trigger Engine
- **DOES NOT** modify Graph Engine
- **DOES NOT** modify Action Engine
- **DOES NOT** modify Overlay Runtime
- **DOES NOT** modify OBS Service
- **ONLY** extends functionality through defined APIs
- **ONLY** registers new components via PluginManager

---

## 3. Plugin Lifecycle

### 3.1 Lifecycle States

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│INSTALLED │────▶│  LOADED  │────▶│ ENABLED  │────▶│  ACTIVE  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                       │                │                │
                       │                │                │
                       ▼                ▼                ▼
                 ┌──────────┐     ┌──────────┐     ┌──────────┐
                 │  ERROR   │◀────│DISABLED  │◀────│UPDATING  │
                 └──────────┘     └──────────┘     └──────────┘
                       │
                       ▼
                 ┌──────────┐
                 │ REMOVED  │
                 └──────────┘
```

### 3.2 Lifecycle Methods

```typescript
interface PluginLifecycle {
  /**
   * Called when plugin is first installed
   * Setup initial configuration
   */
  onInstall(): Promise<void>

  /**
   * Called when plugin is loaded into memory
   * Register components, setup event listeners
   */
  onLoad(): Promise<void>

  /**
   * Called when plugin is enabled by user
   * Start background tasks, connect to services
   */
  onEnable(): Promise<void>

  /**
   * Called when plugin is disabled by user
   * Pause tasks, disconnect from services
   */
  onDisable(): Promise<void>

  /**
   * Called when plugin is updated to new version
   * Migrate data, update configuration
   */
  onUpdate(oldVersion: string): Promise<void>

  /**
   * Called when plugin is being removed
   * Cleanup resources, remove registrations
   */
  onRemove(): Promise<void>
}
```

### 3.3 Lifecycle Flow

```
INSTALL
  │
  │  1. Copy plugin files to plugins/ directory
  │  2. Parse plugin.json manifest
  │  3. Validate permissions
  │  4. Store in database
  │
  ▼
LOAD
  │
  │  1. Read plugin.json
  │  2. Load entry point (main.js)
  │  3. Call onLoad()
  │  4. Register components
  │
  ▼
ENABLE
  │
  │  1. Check permissions
  │  2. Call onEnable()
  │  3. Start background tasks
  │  4. Register event listeners
  │
  ▼
ACTIVE
  │
  │  Plugin is running
  │  Responding to events
  │  Executing actions
  │
  ▼
DISABLE
  │
  │  1. Call onDisable()
  │  2. Stop background tasks
  │  3. Unregister event listeners
  │
  ▼
REMOVE
  │
  │  1. Call onRemove()
  │  2. Unregister all components
  │  3. Remove plugin files
  │  4. Remove from database
```

### 3.4 Error Handling

```typescript
interface PluginError {
  code: string
  message: string
  pluginId: string
  phase: PluginPhase
  timestamp: number
  stack?: string
}

type PluginPhase = 
  | 'install' 
  | 'load' 
  | 'enable' 
  | 'active' 
  | 'disable' 
  | 'update' 
  | 'remove'
```

**Error Recovery Rules:**

| Phase | Recovery Strategy |
|-------|-------------------|
| Install | Rollback, remove partial files |
| Load | Skip plugin, log error, continue |
| Enable | Disable plugin, notify user |
| Active | Log error, continue execution |
| Disable | Force disable, log warning |
| Update | Rollback to previous version |
| Remove | Force remove, cleanup files |

---

## 4. Plugin Manager Design

### 4.1 PluginManager Interface

```typescript
interface IPluginManager {
  // Lifecycle
  initialize(): Promise<void>
  shutdown(): Promise<void>

  // Plugin Operations
  install(pluginPath: string): Promise<Plugin>
  uninstall(pluginId: string): Promise<void>
  enable(pluginId: string): Promise<void>
  disable(pluginId: string): Promise<void>
  update(pluginId: string, version: string): Promise<void>

  // Queries
  getPlugin(pluginId: string): Plugin | undefined
  getAllPlugins(): Plugin[]
  getEnabledPlugins(): Plugin[]
  getPluginsByType(type: PluginType): Plugin[]

  // Events
  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
}
```

### 4.2 PluginManager Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Discovery** | Scan plugin directories for new plugins |
| **Validation** | Verify manifest, check dependencies, validate permissions |
| **Loading** | Load plugin entry points, call lifecycle methods |
| **Permission Management** | Request user approval for permissions |
| **Version Management** | Handle updates, migrations, compatibility |
| **Health Monitoring** | Track plugin status, handle errors |
| **Event Routing** | Route events to appropriate plugins |

### 4.3 Plugin Discovery

```
┌─────────────────────────────────────────────────────────────┐
│                    PLUGIN DISCOVERY                          │
│                                                              │
│  1. Scan Directories                                         │
│     ├── ~/.maulfinity/plugins/         (user plugins)        │
│     ├── <app>/resources/plugins/       (bundled plugins)     │
│     └── <temp>/plugins/               (marketplace cache)    │
│                                                              │
│  2. Read plugin.json from each directory                     │
│                                                              │
│  3. Validate manifest format                                 │
│                                                              │
│  4. Check dependencies                                       │
│                                                              │
│  5. Register in PluginRegistry                               │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Plugin Validation

```typescript
interface PluginValidator {
  // Manifest validation
  validateManifest(manifest: PluginManifest): ValidationResult

  // Permission validation
  validatePermissions(
    requested: Permission[], 
    granted: Permission[]
  ): ValidationResult

  // Dependency validation
  validateDependencies(
    dependencies: PluginDependency[],
    installed: Plugin[]
  ): ValidationResult

  // Version compatibility
  validateCompatibility(
    pluginVersion: string,
    sdkVersion: string
  ): ValidationResult
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}
```

---

## 5. Plugin Manifest Format

### 5.1 plugin.json Structure

```json
{
  "$schema": "https://maulfinity.dev/plugin-schema.json",
  
  "id": "com.author.plugin-name",
  "name": "Plugin Name",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "Author Name",
  "license": "MIT",
  "homepage": "https://example.com",
  
  "type": "connector",
  "tags": ["connector", "streaming", "twitch"],
  
  "main": "dist/index.js",
  "entry": {
    "main": "dist/index.js",
    "renderer": "dist/renderer.js"
  },
  
  "engines": {
    "maulfinity": ">=0.8.0",
    "sdk": ">=1.0.0"
  },
  
  "permissions": [
    "event-bus:read",
    "event-bus:write",
    "action-engine:register",
    "overlay:create"
  ],
  
  "dependencies": {
    "com.author.other-plugin": ">=1.0.0"
  },
  
  "config": {
    "apiKey": {
      "type": "string",
      "required": true,
      "label": "API Key",
      "description": "Your API key"
    },
    "autoConnect": {
      "type": "boolean",
      "default": true,
      "label": "Auto Connect"
    }
  },
  
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "64": "icons/icon-64.png",
    "128": "icons/icon-128.png"
  },
  
  "screenshots": [
    "screenshots/screenshot1.png"
  ],
  
  "changelog": {
    "1.0.0": "Initial release",
    "1.1.0": "Added new features"
  }
}
```

### 5.2 Manifest Fields Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique plugin identifier (reverse domain) |
| `name` | string | ✅ | Human-readable name |
| `version` | string | ✅ | Semantic version (MAJOR.MINOR.PATCH) |
| `description` | string | ✅ | Brief description |
| `author` | string | ✅ | Author name |
| `type` | string | ✅ | Plugin type (see below) |
| `main` | string | ✅ | Entry point path |
| `engines` | object | ✅ | Required Maulfinity/SDK versions |
| `permissions` | string[] | ✅ | Required permissions |
| `dependencies` | object | ❌ | Other plugins required |
| `config` | object | ❌ | Configuration schema |
| `icons` | object | ❌ | Plugin icons |

### 5.3 Plugin Types

| Type | Description | Example |
|------|-------------|---------|
| `connector` | Platform integration | Twitch, Kick, Trovo |
| `action` | New action type | Discord Webhook, Email |
| `node` | Automation graph node | AI Decision, Weather |
| `game` | Game adapter | Valorant, Fortnite |
| `widget` | Overlay widget | Chat Box, Ticker |
| `tool` | Developer utility | Debug Console |
| `theme` | UI theme | Dark Neon, Minimal |
| `bundle` | Collection of plugins | Streamer Pack |

### 5.4 Permission Format

Permissions follow the pattern: `resource:action`

```typescript
type Permission = 
  // Event Bus
  | 'event-bus:read'
  | 'event-bus:write'
  | 'event-bus:subscribe'
  
  // Action Engine
  | 'action-engine:register'
  | 'action-engine:execute'
  
  // Graph Engine
  | 'graph-engine:register-node'
  | 'graph-engine:execute-node'
  
  // Connector
  | 'connector:register'
  | 'connector:connect'
  
  // Overlay
  | 'overlay:create'
  | 'overlay:modify'
  | 'overlay:render'
  
  // Game
  | 'game:register-adapter'
  | 'game:send-command'
  
  // Database
  | 'database:read'
  | 'database:write'
  
  // Network
  | 'network:http'
  | 'network:websocket'
  
  // File System (sandboxed)
  | 'filesystem:read-plugin'
  | 'filesystem:write-plugin'
  
  // UI
  | 'ui:add-menu'
  | 'ui:add-settings'
  | 'ui:add-page'
```

---

## 6. Plugin API Design

### 6.1 MaulfinitySDK Interface

```typescript
interface MaulfinitySDK {
  // Core APIs
  events: EventAPI
  actions: ActionAPI
  graph: GraphAPI
  
  // Integration APIs
  connectors: ConnectorAPI
  games: GameAPI
  overlay: OverlayAPI
  
  // Utility APIs
  storage: StorageAPI
  ui: UIAPI
  logger: LoggerAPI
  
  // Plugin Info
  plugin: PluginInfo
}
```

### 6.2 Event API

```typescript
interface EventAPI {
  /**
   * Subscribe to events
   */
  on(eventType: string, callback: EventCallback): () => void

  /**
   * Subscribe to events once
   */
  once(eventType: string, callback: EventCallback): () => void

  /**
   * Emit custom event
   */
  emit(event: Omit<MaulfinityEvent, 'id' | 'timestamp'>): Promise<void>

  /**
   * Get event history
   */
  getHistory(limit?: number): MaulfinityEvent[]
}

type EventCallback = (event: MaulfinityEvent) => void | Promise<void>
```

### 6.3 Action API

```typescript
interface ActionAPI {
  /**
   * Register a custom action
   */
  register(type: string, action: ActionDefinition): void

  /**
   * Unregister an action
   */
  unregister(type: string): void

  /**
   * Execute an action
   */
  execute(type: string, config: Record<string, unknown>): Promise<void>

  /**
   * Get registered actions
   */
  getRegistered(): string[]
}

interface ActionDefinition {
  name: string
  description: string
  icon?: string
  configSchema: ConfigSchema
  validate(config: Record<string, unknown>): boolean
  execute(config: Record<string, unknown>, event: MaulfinityEvent): Promise<void>
}
```

### 6.4 Graph API

```typescript
interface GraphAPI {
  /**
   * Register a custom node type
   */
  registerNode(node: NodeDefinition): void

  /**
   * Unregister a node type
   */
  unregisterNode(type: string): void

  /**
   * Get registered nodes
   */
  getRegisteredNodes(): NodeDefinition[]

  /**
   * Access graph variables
   */
  getVariable(name: string): unknown
  setVariable(name: string, value: unknown): void

  /**
   * Access counters
   */
  getCounter(name: string): number
  incrementCounter(name: string, amount?: number): number
  resetCounter(name: string): void
}

interface NodeDefinition {
  type: string
  name: string
  description: string
  category: NodeCategory
  icon: string
  configSchema: ConfigSchema
  inputs: NodePortDefinition[]
  outputs: NodePortDefinition[]
  create(): IGraphNode
}
```

### 6.5 Connector API

```typescript
interface ConnectorAPI {
  /**
   * Register a custom connector
   */
  register(connector: ConnectorDefinition): void

  /**
   * Unregister a connector
   */
  unregister(platform: string): void

  /**
   * Get connector status
   */
  getStatus(platform: string): ConnectorStatus

  /**
   * Connect to platform
   */
  connect(platform: string, config: Record<string, unknown>): Promise<boolean>

  /**
   * Disconnect from platform
   */
  disconnect(platform: string): Promise<void>
}

interface ConnectorDefinition {
  platform: string
  name: string
  description: string
  icon?: string
  configSchema: ConfigSchema
  create(config: Record<string, unknown>): IConnector
}
```

### 6.6 Game API

```typescript
interface GameAPI {
  /**
   * Register a game adapter
   */
  registerAdapter(adapter: GameAdapterDefinition): void

  /**
   * Unregister a game adapter
   */
  unregisterAdapter(gameId: string): void

  /**
   * Send command to game
   */
  sendCommand(gameId: string, command: GameCommand): Promise<GameCommandResult>

  /**
   * Get game state
   */
  getState(gameId: string): GameState | undefined
}

interface GameAdapterDefinition {
  gameId: string
  gameName: string
  version: string
  supportedEvents: string[]
  supportedCommands: string[]
  configSchema: ConfigSchema
  create(config: GameAdapterConfig): IGameAdapter
}
```

### 6.7 Overlay API

```typescript
interface OverlayAPI {
  /**
   * Register a custom widget
   */
  registerWidget(widget: WidgetDefinition): void

  /**
   * Unregister a widget
   */
  unregisterWidget(type: string): void

  /**
   * Create overlay element
   */
  createElement(config: OverlayElementConfig): Promise<OverlayElement>

  /**
   * Show overlay
   */
  show(elementId: string): Promise<void>

  /**
   * Hide overlay
   */
  hide(elementId: string): Promise<void>

  /**
   * Update overlay data
   */
  updateData(elementId: string, data: Record<string, unknown>): Promise<void>
}

interface WidgetDefinition {
  type: string
  name: string
  description: string
  icon?: string
  category: WidgetCategory
  defaultConfig: Record<string, unknown>
  render: (data: WidgetData) => JSX.Element
}
```

### 6.8 Storage API

```typescript
interface StorageAPI {
  /**
   * Get plugin-specific storage
   */
  get<T>(key: string): Promise<T | undefined>

  /**
   * Set plugin-specific storage
   */
  set<T>(key: string, value: T): Promise<void>

  /**
   * Delete plugin-specific storage
   */
  delete(key: string): Promise<void>

  /**
   * Clear all plugin storage
   */
  clear(): Promise<void>

  /**
   * Get all keys
   */
  keys(): Promise<string[]>
}
```

### 6.9 UI API

```typescript
interface UIAPI {
  /**
   * Add menu item to sidebar
   */
  addMenuItem(item: MenuItem): void

  /**
   * Remove menu item
   */
  removeMenuItem(id: string): void

  /**
   * Add settings page
   */
  addSettingsPage(page: SettingsPage): void

  /**
   * Show notification
   */
  notify(notification: Notification): void

  /**
   * Show dialog
   */
  showDialog(dialog: Dialog): Promise<DialogResult>
}

interface MenuItem {
  id: string
  label: string
  icon: string
  position: 'top' | 'bottom'
  onClick: () => void
}

interface Notification {
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
}
```

### 6.10 Logger API

```typescript
interface LoggerAPI {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warning(message: string, ...args: unknown[]): void
  error(message: string, error?: Error): void
}
```

---

## 7. Plugin Sandbox Security

### 7.1 Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY BOUNDARY                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PLUGIN (Untrusted Code)                                 │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  Plugin Code                                     │    │    │
│  │  │  - Runs in isolated context                      │    │    │
│  │  │  - No direct access to core                      │    │    │
│  │  │  - API calls go through sandbox                  │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                    ┌─────────▼─────────┐                        │
│                    │  PLUGIN SANDBOX   │                        │
│                    │  (Permission Check)│                        │
│                    └─────────┬─────────┘                        │
│                              │                                   │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │  MAULFINITY CORE (Trusted)                                 │  │
│  │                                                            │  │
│  │  EventBus │ ActionEngine │ GraphEngine │ Database         │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Permission System

```typescript
interface PermissionManager {
  /**
   * Request permission from user
   */
  requestPermission(pluginId: string, permission: Permission): Promise<boolean>

  /**
   * Check if permission is granted
   */
  hasPermission(pluginId: string, permission: Permission): boolean

  /**
   * Revoke permission
   */
  revokePermission(pluginId: string, permission: Permission): void

  /**
   * Get all permissions for a plugin
   */
  getPermissions(pluginId: string): Permission[]
}
```

### 7.3 API Limitation

Plugins can only access APIs they have permission for:

```typescript
class PluginSDK implements MaulfinitySDK {
  constructor(
    private pluginId: string,
    private permissions: Permission[]
  ) {}

  get events(): EventAPI {
    this.checkPermission('event-bus:read')
    return new PluginEventAPI(this.pluginId)
  }

  get actions(): ActionAPI {
    this.checkPermission('action-engine:register')
    return new PluginActionAPI(this.pluginId)
  }

  private checkPermission(permission: Permission): void {
    if (!this.permissions.includes(permission)) {
      throw new PermissionDeniedError(this.pluginId, permission)
    }
  }
}
```

### 7.4 Isolation Strategy

| Resource | Isolation Method |
|----------|------------------|
| **Memory** | Separate V8 context per plugin |
| **File System** | Sandboxed to plugin directory |
| **Network** | Permission-based, rate-limited |
| **Database** | Namespaced tables per plugin |
| **Event Bus** | Filtered by plugin scope |
| **UI** | Isolated rendering context |

### 7.5 File Access Restriction

```
Allowed:
├── ~/.maulfinity/plugins/<plugin-id>/
│   ├── plugin.json
│   ├── dist/
│   ├── assets/
│   └── storage/           (plugin-specific)

Denied:
├── ~/.maulfinity/
│   ├── database.db        (main database)
│   ├── config.json        (app config)
│   └── plugins/           (other plugins)
├── /etc/
├── /usr/
└── Any system directory
```

### 7.6 Network Permission

```typescript
interface NetworkPermission {
  type: 'http' | 'websocket' | 'both'
  domains: string[]      // Allowed domains
  rateLimit?: number     // Requests per minute
  timeout?: number       // Request timeout (ms)
}

// Example: Plugin requiring network access
{
  "permissions": [
    {
      "type": "network",
      "domains": ["api.example.com", "*.twitch.tv"],
      "rateLimit": 60,
      "timeout": 5000
    }
  ]
}
```

---

## 8. Plugin Communication Flow

### 8.1 Plugin → Core Communication

```
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│    Plugin    │              │ Plugin SDK   │              │    Core      │
│              │              │    API       │              │   System     │
└──────┬───────┘              └──────┬───────┘              └──────┬───────┘
       │                             │                             │
       │  1. Call API method         │                             │
       │────────────────────────────▶│                             │
       │                             │                             │
       │                             │  2. Check permission        │
       │                             │────────────┐                │
       │                             │◀───────────┘                │
       │                             │                             │
       │                             │  3. Execute if allowed      │
       │                             │────────────────────────────▶│
       │                             │                             │
       │                             │  4. Return result           │
       │                             │◀────────────────────────────│
       │                             │                             │
       │  5. Return to plugin        │                             │
       │◀────────────────────────────│                             │
```

### 8.2 Core → Plugin Communication (Events)

```
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│    Core      │              │ Plugin       │              │    Plugin    │
│   System     │              │  Manager     │              │              │
└──────┬───────┘              └──────┬───────┘              └──────┬───────┘
       │                             │                             │
       │  1. Emit event              │                             │
       │────────────────────────────▶│                             │
       │                             │                             │
       │                             │  2. Route to plugins        │
       │                             │────────────────────────────▶│
       │                             │                             │
       │                             │  3. Plugin handles event    │
       │                             │◀────────────────────────────│
       │                             │                             │
       │  4. Continue if needed      │                             │
       │◀────────────────────────────│                             │
```

### 8.3 Plugin → Plugin Communication

Plugins communicate indirectly through the Event Bus:

```
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│   Plugin A   │              │  Event Bus   │              │   Plugin B   │
└──────┬───────┘              └──────┬───────┘              └──────┬───────┘
       │                             │                             │
       │  1. Emit custom event       │                             │
       │────────────────────────────▶│                             │
       │                             │                             │
       │                             │  2. Route to subscribers    │
       │                             │────────────────────────────▶│
       │                             │                             │
       │                             │  3. Plugin B processes      │
       │                             │◀────────────────────────────│
```

### 8.4 Example: Custom Connector Plugin

```typescript
// Plugin: Twitch Connector
import { MaulfinitySDK } from '@maulfinity/sdk'

export function activate(sdk: MaulfinitySDK) {
  // Register connector
  sdk.connectors.register({
    platform: 'twitch',
    name: 'Twitch Connector',
    description: 'Connect to Twitch chat',
    configSchema: {
      channel: { type: 'string', required: true },
      oauth: { type: 'string', required: true }
    },
    create: (config) => new TwitchConnector(sdk, config)
  })

  // Listen for events
  sdk.events.on('twitch.message', async (event) => {
    sdk.logger.info(`Twitch message: ${event.payload.message}`)
  })
}

class TwitchConnector {
  constructor(
    private sdk: MaulfinitySDK,
    private config: Record<string, unknown>
  ) {}

  async connect() {
    // Connect to Twitch
    // Emit events through SDK
    this.sdk.events.emit({
      type: 'twitch.connected',
      platform: 'twitch',
      user: 'system',
      payload: { channel: this.config.channel }
    })
  }
}
```

---

## 9. Custom Node Architecture

### 9.1 Node Plugin Interface

```typescript
interface NodePlugin {
  /**
   * Register custom nodes
   */
  registerNodes(graphEngine: GraphEngine): void

  /**
   * Unregister custom nodes
   */
  unregisterNodes(graphEngine: GraphEngine): void
}
```

### 9.2 Custom Node Types

Plugins can create any node category:

| Category | Purpose | Example |
|----------|---------|---------|
| **Event** | Custom event triggers | Discord Message, Steam Achievement |
| **Condition** | Custom conditions | API Response Check, Time Range |
| **Logic** | Custom logic gates | weighted Random, State Machine |
| **Delay** | Custom timing | Cron Schedule, Webhook Wait |
| **State** | Custom state management | Database Counter, Cache Store |
| **Action** | Custom actions | Send Email, API Call |
| **Utility** | Helper nodes | JSON Parse, String Format |

### 9.3 Custom Node Implementation

```typescript
// Plugin: AI Decision Node
import { IGraphNode, NodeContext, NodeOutput } from '@maulfinity/graph-engine'

export class AIDecisionNode implements IGraphNode {
  readonly type = 'plugin:ai-decision'
  readonly category = 'logic'

  async execute(context: NodeContext): Promise<NodeOutput> {
    const { prompt, model } = context.config

    // Call AI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a stream automation assistant.' },
          { role: 'user', content: prompt }
        ]
      })
    })

    const data = await response.json()
    const decision = data.choices[0].message.content

    // Route based on AI decision
    if (decision.includes('yes') || decision.includes('true')) {
      return { signal: 'true', data: { decision } }
    } else {
      return { signal: 'false', data: { decision } }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.prompt === 'string' && config.prompt.length > 0
  }

  getInputs() {
    return [
      { name: 'trigger', type: 'signal', required: true },
      { name: 'context', type: 'data', required: false }
    ]
  }

  getOutputs() {
    return [
      { name: 'true', type: 'signal' },
      { name: 'false', type: 'signal' }
    ]
  }

  getConfigSchema() {
    return {
      prompt: { type: 'string', required: true, label: 'AI Prompt' },
      model: { type: 'select', options: ['gpt-4', 'gpt-3.5-turbo'], default: 'gpt-4', label: 'Model' }
    }
  }
}
```

### 9.4 Node Registration

```typescript
// In plugin main.ts
export function activate(sdk: MaulfinitySDK) {
  sdk.graph.registerNode({
    type: 'plugin:ai-decision',
    name: 'AI Decision',
    description: 'Use AI to make decisions',
    category: 'logic',
    icon: '🤖',
    configSchema: {
      prompt: { type: 'string', required: true },
      model: { type: 'string', default: 'gpt-4' }
    },
    inputs: [
      { name: 'trigger', type: 'signal', required: true },
      { name: 'context', type: 'data', required: false }
    ],
    outputs: [
      { name: 'true', type: 'signal' },
      { name: 'false', type: 'signal' }
    ],
    create: () => new AIDecisionNode()
  })
}
```

### 9.5 Node Port System

```typescript
interface NodePortDefinition {
  name: string
  type: 'event' | 'signal' | 'data' | 'any'
  required: boolean
  default?: unknown
  label?: string
  description?: string
}
```

---

## 10. Custom Overlay Widget Architecture

### 10.1 Widget Plugin Interface

```typescript
interface WidgetPlugin {
  /**
   * Register custom widgets
   */
  registerWidgets(overlayRuntime: OverlayRuntime): void

  /**
   * Unregister custom widgets
   */
  unregisterWidgets(overlayRuntime: OverlayRuntime): void
}
```

### 10.2 Widget Definition

```typescript
interface WidgetDefinition {
  type: string
  name: string
  description: string
  icon?: string
  category: WidgetCategory
  defaultConfig: Record<string, unknown>
  defaultSize: { width: number; height: number }
  
  // Rendering
  render: WidgetRenderer
  update?: WidgetUpdater
  
  // Lifecycle
  onMount?: (element: HTMLElement) => void
  onDestroy?: () => void
  
  // Configuration
  configSchema: ConfigSchema
}

type WidgetCategory = 'text' | 'image' | 'animation' | 'data' | 'interactive'

type WidgetRenderer = (data: WidgetData, config: WidgetConfig) => JSX.Element

type WidgetUpdater = (
  element: HTMLElement, 
  data: WidgetData, 
  config: WidgetConfig
) => void
```

### 10.3 Widget Implementation

```typescript
// Plugin: Donation Ticker Widget
import { WidgetDefinition } from '@maulfinity/overlay'

export const DonationTickerWidget: WidgetDefinition = {
  type: 'plugin:donation-ticker',
  name: 'Donation Ticker',
  description: 'Scrolling list of recent donations',
  icon: '💰',
  category: 'data',
  defaultSize: { width: 400, height: 100 },
  defaultConfig: {
    maxItems: 5,
    scrollSpeed: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    textColor: '#ffffff'
  },
  configSchema: {
    maxItems: { type: 'number', default: 5, min: 1, max: 20, label: 'Max Items' },
    scrollSpeed: { type: 'number', default: 2, min: 0.5, max: 10, label: 'Scroll Speed' },
    backgroundColor: { type: 'color', default: 'rgba(0,0,0,0.5)', label: 'Background' },
    textColor: { type: 'color', default: '#ffffff', label: 'Text Color' }
  },
  render: (data, config) => {
    const donations = data.donations || []
    return (
      <div className="donation-ticker" style={{
        backgroundColor: config.backgroundColor,
        color: config.textColor,
        overflow: 'hidden'
      }}>
        <div className="scroll-container">
          {donations.slice(0, config.maxItems).map((donation, i) => (
            <div key={i} className="donation-item">
              <span className="user">{donation.user}</span>
              <span className="amount">${donation.amount}</span>
              <span className="message">{donation.message}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
}
```

### 10.4 Widget Registration

```typescript
export function activate(sdk: MaulfinitySDK) {
  sdk.overlay.registerWidget(DonationTickerWidget)

  // Listen for donations to update widget data
  sdk.events.on('donation', async (event) => {
    const { user, amount, message } = event.payload
    
    // Update widget data
    await sdk.overlay.updateData('donation-ticker', {
      donations: [
        { user, amount, message },
        ...(await sdk.storage.get('recent-donations') || [])
      ].slice(0, 10)
    })
  })
}
```

### 10.5 Data Binding

Widgets receive real-time data through:

| Method | Description |
|--------|-------------|
| **Event Binding** | Automatic updates when events occur |
| **Polling** | Periodic data refresh |
| **WebSocket** | Real-time data stream |
| **Manual** | SDK overlay.updateData() |

```typescript
interface WidgetData {
  [key: string]: unknown
}

interface WidgetConfig {
  [key: string]: unknown
}
```

---

## 11. Plugin Storage

### 11.1 Database Schema

#### plugins Table

```sql
CREATE TABLE plugins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  author TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'installed',
  enabled INTEGER NOT NULL DEFAULT 0,
  manifest_json TEXT NOT NULL,
  permissions_json TEXT NOT NULL DEFAULT '[]',
  config_json TEXT NOT NULL DEFAULT '{}',
  path TEXT NOT NULL,
  installed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_enabled_at TEXT,
  error_count INTEGER DEFAULT 0,
  last_error TEXT
);
```

#### plugin_settings Table

```sql
CREATE TABLE plugin_settings (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
  UNIQUE(plugin_id, key)
);
```

#### plugin_permissions Table

```sql
CREATE TABLE plugin_permissions (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  granted INTEGER NOT NULL DEFAULT 0,
  granted_at TEXT,
  revoked_at TEXT,
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
  UNIQUE(plugin_id, permission)
);
```

#### plugin_storage Table

```sql
CREATE TABLE plugin_storage (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
  UNIQUE(plugin_id, key)
);
```

#### plugin_logs Table

```sql
CREATE TABLE plugin_logs (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);
```

### 11.2 Indexes

```sql
CREATE INDEX idx_plugins_status ON plugins(status);
CREATE INDEX idx_plugins_type ON plugins(type);
CREATE INDEX idx_plugins_enabled ON plugins(enabled);
CREATE INDEX idx_plugin_settings_plugin_id ON plugin_settings(plugin_id);
CREATE INDEX idx_plugin_permissions_plugin_id ON plugin_permissions(plugin_id);
CREATE INDEX idx_plugin_storage_plugin_id ON plugin_storage(plugin_id);
CREATE INDEX idx_plugin_logs_plugin_id ON plugin_logs(plugin_id);
CREATE INDEX idx_plugin_logs_level ON plugin_logs(level);
CREATE INDEX idx_plugin_logs_created_at ON plugin_logs(created_at);
```

---

## 12. Version Compatibility

### 12.1 SDK Versioning

Maulfinity uses **Semantic Versioning**:

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
MINOR: New features (backward compatible)
PATCH: Bug fixes
```

### 12.2 Compatibility Matrix

| SDK Version | Maulfinity Version | Compatibility |
|-------------|-------------------|---------------|
| 1.0.x | 0.8.x - 0.9.x | ✅ Compatible |
| 1.1.x | 0.9.x - 1.0.x | ✅ Compatible |
| 2.0.x | 1.0.x+ | ⚠️ Breaking changes |

### 12.3 Breaking Changes Strategy

When major version changes occur:

1. **Deprecation Period**: 6 months
2. **Migration Guide**: Provided for each breaking change
3. **Compatibility Layer**: Temporary shim for old APIs
4. **Plugin Updates**: Automatic notification to plugin authors

### 12.4 Version Declaration

```json
{
  "engines": {
    "maulfinity": ">=0.8.0 <1.0.0",
    "sdk": ">=1.0.0 <2.0.0"
  }
}
```

### 12.5 Migration Strategy

```typescript
interface MigrationScript {
  fromVersion: string
  toVersion: string
  migrate: (data: PluginData) => Promise<PluginData>
}

// Plugin can declare migrations
{
  "migrations": [
    {
      "from": "1.0.0",
      "to": "2.0.0",
      "script": "migrations/1.0.0-to-2.0.0.js"
    }
  ]
}
```

---

## 13. Marketplace Preparation

### 13.1 Plugin Discovery

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLUGIN MARKETPLACE                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🔍 Search: "twitch"                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🎨 Categories                                            │    │
│  │  All │ Connectors │ Actions │ Widgets │ Games │ Tools   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📦 Featured Plugins                                      │    │
│  │                                                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │ Twitch   │  │ Discord  │  │ AI Chat  │              │    │
│  │  │ ⭐ 4.8   │  │ ⭐ 4.9   │  │ ⭐ 4.7   │              │    │
│  │  │ [Install]│  │ [Install]│  │ [Install]│              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📋 All Plugins                                           │    │
│  │                                                          │    │
│  │  🎮 GTA V Adapter      by Maulfinity    ⭐ 4.8  [Install]│   │
│  │  🎮 Minecraft Adapter  by Community     ⭐ 4.5  [Install]│   │
│  │  🎨 Chat Box Widget    by Maulfinity    ⭐ 4.9  [Install]│   │
│  │  🔌 Twitch Connector   by Community     ⭐ 4.7  [Install]│   │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 Plugin Publishing

```typescript
interface PluginPublish {
  // Package plugin for marketplace
  package(pluginPath: string): Promise<PluginPackage>

  // Submit to marketplace
  submit(pluginPackage: PluginPackage): Promise<SubmissionResult>

  // Update existing plugin
  update(pluginId: string, version: string): Promise<void>
}

interface PluginPackage {
  manifest: PluginManifest
  files: Buffer[]
  checksum: string
  signature: string
}
```

### 13.3 Plugin Rating System

```typescript
interface PluginRating {
  pluginId: string
  averageRating: number
  totalReviews: number
  ratings: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  reviews: PluginReview[]
}

interface PluginReview {
  id: string
  userId: string
  rating: number
  title: string
  content: string
  createdAt: string
  helpful: number
}
```

### 13.4 Marketplace API

```typescript
interface MarketplaceAPI {
  // Discovery
  search(query: string, filters?: PluginFilters): Promise<Plugin[]>
  getFeatured(): Promise<Plugin[]>
  getByCategory(category: string): Promise<Plugin[]>

  // Plugin Info
  getPlugin(pluginId: string): Promise<PluginDetails>
  getVersions(pluginId: string): Promise<PluginVersion[]>
  getChangelog(pluginId: string, version: string): Promise<string>

  // Downloads
  download(pluginId: string, version: string): Promise<PluginPackage>

  // Ratings
  getRatings(pluginId: string): Promise<PluginRating>
  submitReview(pluginId: string, review: PluginReview): Promise<void>

  // Author
  getAuthorPlugins(authorId: string): Promise<Plugin[]>
  publishPlugin(plugin: PluginPackage): Promise<PublishResult>
}
```

---

## 14. Developer Experience

### 14.1 Plugin Folder Structure

```
my-plugin/
├── plugin.json              # Manifest
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── README.md                # Documentation
├── LICENSE                  # License
│
├── src/
│   ├── index.ts             # Entry point
│   ├── connector.ts         # Connector logic (if applicable)
│   ├── actions/             # Custom actions (if applicable)
│   │   └── my-action.ts
│   ├── nodes/               # Custom nodes (if applicable)
│   │   └── my-node.ts
│   ├── widgets/             # Custom widgets (if applicable)
│   │   └── my-widget.tsx
│   └── utils/               # Utilities
│       └── helper.ts
│
├── dist/                    # Compiled output
│   ├── index.js
│   └── ...
│
├── icons/                   # Plugin icons
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-64.png
│   └── icon-128.png
│
├── screenshots/             # Marketplace screenshots
│   └── screenshot1.png
│
└── tests/                   # Unit tests
    └── my-plugin.test.ts
```

### 14.2 Development Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT WORKFLOW                          │
│                                                                  │
│  1. SCAFFOLD                                                     │
│     $ maulfinity plugin create my-plugin                        │
│     → Generates boilerplate                                     │
│                                                                  │
│  2. DEVELOP                                                      │
│     $ cd my-plugin                                               │
│     $ npm install                                                │
│     $ npm run watch                                              │
│     → Hot reload during development                             │
│                                                                  │
│  3. TEST                                                         │
│     $ maulfinity plugin test                                    │
│     → Run plugin in sandbox                                     │
│                                                                  │
│  4. BUILD                                                        │
│     $ npm run build                                              │
│     → Compile TypeScript                                        │
│                                                                  │
│  5. PACKAGE                                                      │
│     $ maulfinity plugin package                                 │
│     → Create distributable                                      │
│                                                                  │
│  6. PUBLISH                                                      │
│     $ maulfinity plugin publish                                 │
│     → Submit to marketplace                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 14.3 CLI Commands

```bash
# Plugin management
maulfinity plugin list              # List installed plugins
maulfinity plugin install <path>    # Install plugin
maulfinity plugin uninstall <id>    # Uninstall plugin
maulfinity plugin enable <id>       # Enable plugin
maulfinity plugin disable <id>      # Disable plugin
maulfinity plugin update <id>       # Update plugin

# Development
maulfinity plugin create <name>     # Create new plugin
maulfinity plugin dev               # Start development mode
maulfinity plugin test              # Run plugin tests
maulfinity plugin build             # Build plugin
maulfinity plugin package           # Package for distribution
maulfinity plugin publish           # Publish to marketplace

# Debugging
maulfinity plugin logs <id>         # View plugin logs
maulfinity plugin debug <id>        # Start debug session
maulfinity plugin validate <path>   # Validate plugin manifest
```

### 14.4 Debug Tools

```typescript
interface PluginDebugger {
  /**
   * Set breakpoint in plugin code
   */
  setBreakpoint(file: string, line: number): void

  /**
   * Step through execution
   */
  stepOver(): void
  stepInto(): void
  stepOut(): void

  /**
   * Inspect variables
   */
  inspect(variable: string): unknown

  /**
   * View call stack
   */
  getCallStack(): StackFrame[]

  /**
   * Monitor API calls
   */
  onApiCall(callback: (call: ApiCall) => void): () => void
}
```

### 14.5 Testing Framework

```typescript
import { PluginTestRunner } from '@maulfinity/test'

describe('My Plugin', () => {
  let sdk: MockSDK
  let plugin: MyPlugin

  beforeEach(async () => {
    sdk = new MockSDK()
    plugin = new MyPlugin()
    await plugin.activate(sdk)
  })

  afterEach(async () => {
    await plugin.deactivate(sdk)
  })

  it('should register connector', () => {
    expect(sdk.connectors.registered).toContain('my-platform')
  })

  it('should handle events', async () => {
    await sdk.events.emit({
      type: 'my-platform.message',
      platform: 'my-platform',
      user: 'test-user',
      payload: { message: 'Hello' }
    })

    expect(sdk.logger.logs).toContain('Received: Hello')
  })
})
```

---

## 15. Future Roadmap

### 15.1 Short Term (v0.8–v0.9)

- [ ] PluginManager core implementation
- [ ] Plugin SDK API (basic)
- [ ] Plugin manifest validation
- [ ] Plugin loading/unloading
- [ ] Permission system
- [ ] 3 example plugins

### 15.2 Medium Term (v1.0–v1.1)

- [ ] Plugin Sandbox (V8 isolates)
- [ ] Custom Node support
- [ ] Custom Widget support
- [ ] Plugin storage API
- [ ] Plugin CLI tools
- [ ] Plugin testing framework

### 15.3 Long Term (v1.2+)

- [ ] Marketplace launch
- [ ] Plugin publishing workflow
- [ ] Plugin ratings/reviews
- [ ] Plugin analytics
- [ ] AI-assisted plugin development
- [ ] Plugin templates

---

## Appendix A: Example Plugin

### Discord Integration Plugin

```json
{
  "id": "com.maulfinity.discord",
  "name": "Discord Integration",
  "version": "1.0.0",
  "description": "Connect Maulfinity with Discord",
  "author": "Maulfinity",
  "type": "connector",
  "main": "dist/index.js",
  "engines": {
    "maulfinity": ">=0.8.0",
    "sdk": ">=1.0.0"
  },
  "permissions": [
    "event-bus:read",
    "event-bus:write",
    "network:websocket",
    "ui:add-menu"
  ],
  "config": {
    "botToken": {
      "type": "string",
      "required": true,
      "label": "Bot Token"
    },
    "guildId": {
      "type": "string",
      "required": true,
      "label": "Server ID"
    }
  }
}
```

```typescript
// src/index.ts
import { MaulfinitySDK } from '@maulfinity/sdk'
import { Client, GatewayIntentBits } from 'discord.js'

export function activate(sdk: MaulfinitySDK) {
  const config = sdk.plugin.getConfig()
  
  // Create Discord client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  })

  // Login
  client.login(config.botToken)

  // Listen for Discord messages
  client.on('messageCreate', (message) => {
    if (message.guild?.id !== config.guildId) return

    // Emit to Maulfinity
    sdk.events.emit({
      type: 'discord.message',
      platform: 'discord',
      user: message.author.username,
      payload: {
        content: message.content,
        channel: message.channel.name,
        author: message.author.tag
      }
    })
  })

  // Listen for Maulfinity events
  sdk.events.on('gift', async (event) => {
    // Send to Discord
    const channel = client.channels.cache.get(config.announcementChannel)
    if (channel?.isTextBased()) {
      await channel.send(`🎉 ${event.user} sent a gift: ${event.payload.name}!`)
    }
  })

  // Register menu item
  sdk.ui.addMenuItem({
    id: 'discord-status',
    label: 'Discord',
    icon: '💬',
    position: 'bottom',
    onClick: () => {
      sdk.ui.notify({
        type: 'info',
        title: 'Discord',
        message: `Connected to ${client.guilds.cache.size} servers`
      })
    }
  })
}

export function deactivate(sdk: MaulfinitySDK) {
  // Cleanup
}
```

---

**End of Plugin SDK Architecture Document**
