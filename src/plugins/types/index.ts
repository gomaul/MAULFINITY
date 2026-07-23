/**
 * Plugin SDK Type Definitions
 * 
 * Comprehensive types for the Maulfinity Plugin System
 */

// ============================================================
// PLUGIN MANIFEST TYPES
// ============================================================

/**
 * Plugin manifest (plugin.json)
 */
export interface PluginManifest {
  /** Unique plugin identifier (reverse domain notation) */
  id: string
  /** Human-readable name */
  name: string
  /** Semantic version */
  version: string
  /** Brief description */
  description: string
  /** Author name */
  author: string
  /** Plugin license */
  license?: string
  /** Plugin homepage */
  homepage?: string
  /** Plugin type */
  type: PluginType
  /** Searchable tags */
  tags?: string[]
  /** Entry point path */
  entry: string
  /** Required Maulfinity versions */
  engines: PluginEngines
  /** Required permissions */
  permissions: PluginPermission[]
  /** Other plugins required */
  dependencies?: Record<string, string>
  /** Configuration schema */
  config?: Record<string, PluginConfigField>
  /** Plugin icons */
  icons?: PluginIcons
}

/**
 * Plugin type
 */
export type PluginType = 
  | 'connector'
  | 'action'
  | 'node'
  | 'game'
  | 'widget'
  | 'tool'
  | 'theme'
  | 'bundle'

/**
 * Required engine versions
 */
export interface PluginEngines {
  maulfinity: string
  sdk: string
}

/**
 * Configuration field definition
 */
export interface PluginConfigField {
  type: 'string' | 'number' | 'boolean' | 'select' | 'color'
  required?: boolean
  default?: unknown
  label?: string
  description?: string
  options?: string[]
  min?: number
  max?: number
}

/**
 * Plugin icons
 */
export interface PluginIcons {
  '16'?: string
  '32'?: string
  '64'?: string
  '128'?: string
}

// ============================================================
// PLUGIN STATE TYPES
// ============================================================

/**
 * Plugin state
 */
export type PluginState = 
  | 'installed'
  | 'loaded'
  | 'enabled'
  | 'active'
  | 'disabled'
  | 'error'
  | 'updating'

/**
 * Plugin instance
 */
export interface Plugin {
  /** Plugin manifest */
  manifest: PluginManifest
  /** Current state */
  state: PluginState
  /** Plugin configuration */
  config: Record<string, unknown>
  /** Granted permissions */
  grantedPermissions: PluginPermission[]
  /** Error message if in error state */
  error?: string
  /** Installation timestamp */
  installedAt: string
  /** Last enabled timestamp */
  lastEnabledAt?: string
  /** Plugin path */
  path: string
}

// ============================================================
// PLUGIN PERMISSION TYPES
// ============================================================

/**
 * Plugin permission
 */
export type PluginPermission =
  // Event Bus
  | 'events.read'
  | 'events.write'
  | 'events.subscribe'
  
  // Action Engine
  | 'actions.create'
  | 'actions.execute'
  
  // Graph Engine
  | 'graph.register-node'
  | 'graph.execute-node'
  
  // Connector
  | 'connector.register'
  | 'connector.connect'
  
  // Overlay
  | 'overlay.create'
  | 'overlay.modify'
  | 'overlay.render'
  
  // Game
  | 'game.register-adapter'
  | 'game.connect'
  
  // Database
  | 'database.read'
  | 'database.write'
  
  // Network
  | 'network.http'
  | 'network.websocket'
  
  // File System (sandboxed)
  | 'filesystem.read-plugin'
  | 'filesystem.write-plugin'
  
  // UI
  | 'ui.add-menu'
  | 'ui.add-settings'
  | 'ui.add-page'
  | 'ui.notify'

// ============================================================
// PLUGIN LIFECYCLE TYPES
// ============================================================

/**
 * Plugin lifecycle hooks
 */
export interface PluginLifecycle {
  onInstall?(): Promise<void>
  onLoad?(): Promise<void>
  onEnable?(): Promise<void>
  onDisable?(): Promise<void>
  onUpdate?(oldVersion: string): Promise<void>
  onRemove?(): Promise<void>
}

/**
 * Plugin activation function
 */
export type PluginActivator = (sdk: PluginSDK) => Promise<void> | void

/**
 * Plugin deactivation function
 */
export type PluginDeactivator = (sdk: PluginSDK) => Promise<void> | void

// ============================================================
// PLUGIN SDK API TYPES
// ============================================================

/**
 * Plugin SDK interface (provided to plugins)
 */
export interface PluginSDK {
  /** Plugin information */
  plugin: PluginInfo
  /** Event API */
  events: EventAPI
  /** Action API */
  actions: ActionAPI
  /** Graph API */
  graph: GraphAPI
  /** Connector API */
  connectors: ConnectorAPI
  /** Game API */
  games: GameAPI
  /** Overlay API */
  overlay: OverlayAPI
  /** Storage API */
  storage: StorageAPI
  /** UI API */
  ui: UIAPI
  /** Logger API */
  logger: LoggerAPI
}

/**
 * Plugin info (read-only)
 */
export interface PluginInfo {
  id: string
  name: string
  version: string
  getConfig(): Record<string, unknown>
}

/**
 * Event API
 */
export interface EventAPI {
  on(eventType: string, callback: EventCallback): () => void
  once(eventType: string, callback: EventCallback): () => void
  emit(event: Omit<import('@shared/types').MaulfinityEvent, 'id' | 'timestamp'>): Promise<void>
  getHistory(limit?: number): import('@shared/types').MaulfinityEvent[]
}

export type EventCallback = (event: import('@shared/types').MaulfinityEvent) => void | Promise<void>

/**
 * Action API
 */
export interface ActionAPI {
  register(type: string, action: ActionDefinition): void
  unregister(type: string): void
  execute(type: string, config: Record<string, unknown>): Promise<void>
  getRegistered(): string[]
}

export interface ActionDefinition {
  name: string
  description: string
  icon?: string
  validate(config: Record<string, unknown>): boolean
  execute(config: Record<string, unknown>, event: import('@shared/types').MaulfinityEvent): Promise<void>
}

/**
 * Graph API
 */
export interface GraphAPI {
  registerNode(node: NodeDefinition): void
  unregisterNode(type: string): void
  getRegisteredNodes(): NodeDefinition[]
}

export interface NodeDefinition {
  type: string
  name: string
  description: string
  category: string
  icon: string
  inputs: NodePortDefinition[]
  outputs: NodePortDefinition[]
}

export interface NodePortDefinition {
  name: string
  type: 'event' | 'signal' | 'data' | 'any'
  required: boolean
}

/**
 * Connector API
 */
export interface ConnectorAPI {
  register(connector: ConnectorDefinition): void
  unregister(platform: string): void
  getStatus(platform: string): string
}

export interface ConnectorDefinition {
  platform: string
  name: string
  description: string
  icon?: string
}

/**
 * Game API
 */
export interface GameAPI {
  registerAdapter(adapter: GameAdapterDefinition): void
  unregisterAdapter(gameId: string): void
}

export interface GameAdapterDefinition {
  gameId: string
  gameName: string
  version: string
  supportedEvents: string[]
  supportedCommands: string[]
}

/**
 * Overlay API
 */
export interface OverlayAPI {
  registerWidget(widget: WidgetDefinition): void
  unregisterWidget(type: string): void
  getRegisteredWidgets(): WidgetDefinition[]
}

export interface WidgetDefinition {
  type: string
  name: string
  description: string
  icon?: string
  category: string
  defaultConfig: Record<string, unknown>
}

/**
 * Storage API
 */
export interface StorageAPI {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
}

/**
 * UI API
 */
export interface UIAPI {
  addMenuItem(item: MenuItem): void
  removeMenuItem(id: string): void
  notify(notification: Notification): void
}

export interface MenuItem {
  id: string
  label: string
  icon: string
  position: 'top' | 'bottom'
  onClick: () => void
}

export interface Notification {
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
}

/**
 * Logger API
 */
export interface LoggerAPI {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warning(message: string, ...args: unknown[]): void
  error(message: string, error?: Error): void
}

// ============================================================
// PLUGIN DATABASE TYPES
// ============================================================

/**
 * Plugin row in database
 */
export interface PluginRow {
  id: string
  name: string
  version: string
  description: string | null
  author: string | null
  type: string
  status: string
  enabled: number
  entry_point: string
  manifest_json: string
  permissions_json: string
  config_json: string
  path: string
  installed_at: string
  updated_at: string
  last_enabled_at: string | null
  error_count: number
  last_error: string | null
}

/**
 * Plugin settings row
 */
export interface PluginSettingRow {
  id: string
  plugin_id: string
  key: string
  value: string
  created_at: string
  updated_at: string
}

/**
 * Plugin storage row
 */
export interface PluginStorageRow {
  id: string
  plugin_id: string
  key: string
  value: string
  created_at: string
  updated_at: string
}

// ============================================================
// PLUGIN EVENTS
// ============================================================

/**
 * Plugin manager events
 */
export interface PluginManagerEvents {
  'plugin:installed': { pluginId: string }
  'plugin:loaded': { pluginId: string }
  'plugin:enabled': { pluginId: string }
  'plugin:disabled': { pluginId: string }
  'plugin:removed': { pluginId: string }
  'plugin:error': { pluginId: string; error: Error }
}
