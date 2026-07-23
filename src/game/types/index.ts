import { MaulfinityEvent } from '@core/event-bus/types'

// ============================================================
// GAME ADAPTER TYPES
// ============================================================

/**
 * Game adapter state
 */
export type GameAdapterState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disabled'

/**
 * Game adapter configuration
 */
export interface GameAdapterConfig {
  /** Bridge type to use */
  bridgeType: BridgeType
  /** Bridge-specific configuration */
  bridgeConfig: BridgeConfig
  /** Auto-connect on startup */
  autoConnect: boolean
  /** Reconnect attempts */
  reconnectAttempts: number
  /** Reconnect delay in ms */
  reconnectDelay: number
  /** Custom settings for the adapter */
  customSettings: Record<string, unknown>
}

/**
 * Default adapter configuration
 */
export const DEFAULT_ADAPTER_CONFIG: GameAdapterConfig = {
  bridgeType: 'websocket',
  bridgeConfig: { host: 'localhost', port: 8765 },
  autoConnect: false,
  reconnectAttempts: 3,
  reconnectDelay: 5000,
  customSettings: {}
}

/**
 * Game information
 */
export interface GameInfo {
  id: string
  name: string
  version: string
  description: string
  icon?: string
  platform: GamePlatform
  adapterVersion: string
  supportedEvents: string[]
  supportedCommands: string[]
}

/**
 * Supported game platforms
 */
export type GamePlatform = 'pc' | 'console' | 'mobile' | 'web'

/**
 * Game adapter statistics
 */
export interface GameAdapterStats {
  gameId: string
  state: GameAdapterState
  eventsReceived: number
  eventsEmitted: number
  commandsExecuted: number
  commandsFailed: number
  errors: number
  uptime: number
  lastEventAt: number | null
  lastCommandAt: number | null
}

// ============================================================
// GAME BRIDGE TYPES
// ============================================================

/**
 * Bridge type
 */
export type BridgeType = 'websocket' | 'socket' | 'file'

/**
 * Bridge configuration
 */
export type BridgeConfig = WebSocketBridgeConfig | SocketBridgeConfig | FileBridgeConfig

/**
 * WebSocket bridge configuration
 */
export interface WebSocketBridgeConfig {
  host: string
  port: number
  path?: string
  secure?: boolean
}

/**
 * Local socket bridge configuration
 */
export interface SocketBridgeConfig {
  path: string
  type: 'named_pipe' | 'unix'
}

/**
 * File watcher bridge configuration
 */
export interface FileBridgeConfig {
  watchDir: string
  eventDir: string
  responseDir: string
  pollInterval?: number
}

// ============================================================
// GAME EVENT TYPES
// ============================================================

/**
 * Raw game event (before normalization)
 */
export interface GameRawEvent {
  /** Game-specific event type */
  type: string
  /** Timestamp */
  timestamp: number
  /** Event data */
  data: Record<string, unknown>
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Normalized game event (extends MaulfinityEvent)
 */
export interface GameEvent extends MaulfinityEvent {
  /** Always 'game' for game events */
  platform: 'game'
  /** Game source information */
  source: {
    gameId: string
    adapterId: string
  }
}

/**
 * Event mapping definition for normalizer
 */
export interface EventMapping {
  /** Game-specific event type */
  gameEvent: string
  /** Normalized event type */
  normalizedEvent: string
  /** Event category */
  category: GameEventCategory
  /** Optional transformer function */
  transformer?: (data: Record<string, unknown>) => Record<string, unknown>
}

/**
 * Game event categories
 */
export type GameEventCategory =
  | 'player'
  | 'vehicle'
  | 'combat'
  | 'world'
  | 'economy'
  | 'custom'

// ============================================================
// GAME STATE TYPES
// ============================================================

/**
 * Player state
 */
export interface PlayerState {
  id: string
  name: string
  health: number
  maxHealth: number
  armor: number
  position: { x: number; y: number; z: number }
  rotation: number
  isInVehicle: boolean
  vehicleId?: string
  weapons: string[]
  money: number
  wantedLevel: number
  level?: number
  score?: number
}

/**
 * Vehicle state
 */
export interface VehicleState {
  id: string
  model: string
  position: { x: number; y: number; z: number }
  rotation: number
  health: number
  speed: number
  driver?: string
  passengers: string[]
}

/**
 * World state
 */
export interface WorldState {
  weather: string
  time: { hour: number; minute: number }
  area: string
  isNight: boolean
}

/**
 * Game state
 */
export interface GameState {
  gameId: string
  timestamp: number
  connected: boolean
  players: Map<string, PlayerState>
  vehicles: Map<string, VehicleState>
  world: WorldState
}

/**
 * State update operation
 */
export interface StateUpdate {
  path: string
  operation: 'set' | 'add' | 'remove'
  value: unknown
  timestamp: number
}

/**
 * State change callback
 */
export type StateChangeCallback = (update: StateUpdate) => void

// ============================================================
// GAME COMMAND TYPES
// ============================================================

/**
 * Game command
 */
export interface GameCommand {
  /** Command action */
  action: string
  /** Command parameters */
  params: Record<string, unknown>
  /** Timeout in ms */
  timeout?: number
}

/**
 * Game command result
 */
export interface GameCommandResult {
  success: boolean
  data?: unknown
  error?: string
  duration: number
}

// ============================================================
// GAME REGISTRY TYPES
// ============================================================

/**
 * Game registration
 */
export interface GameRegistration {
  id: string
  name: string
  version: string
  description: string
  adapter: string
  adapterVersion: string
  status: GameStatus
  config: GameAdapterConfig
  installedAt: string
  lastUsed?: string
}

/**
 * Game status
 */
export type GameStatus = 'installed' | 'configured' | 'connected' | 'error' | 'disabled'

/**
 * Game permission
 */
export interface GamePermission {
  type: 'read' | 'write' | 'execute'
  resource: string
  description: string
}

// ============================================================
// GAME MANAGER TYPES
// ============================================================

/**
 * Game manager events
 */
export interface GameEvents {
  'game:connected': { gameId: string }
  'game:disconnected': { gameId: string }
  'game:error': { gameId: string; error: Error }
  'game:event': { gameId: string; event: GameEvent }
  'game:state': { gameId: string; state: Partial<GameState> }
}

/**
 * Game adapter event callback
 */
export type GameEventCallback = (event: GameRawEvent) => void
