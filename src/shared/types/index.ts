// Event types
export interface MaulfinityEvent {
  id: string
  type: string
  platform: string
  user: string
  payload: Record<string, unknown>
  timestamp: number
}

// Trigger types
export interface TriggerCondition {
  gift?: string
  value?: number
  username?: string
  keyword?: string
  platform?: string
}

export interface TriggerAction {
  type: string
  config: Record<string, unknown>
}

export interface Trigger {
  id: string
  profile_id: string
  name: string
  event_type: string
  condition: TriggerCondition
  actions: TriggerAction[]
  enabled: boolean
}

// Profile types
export interface Profile {
  id: string
  name: string
  description: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

// Asset types
export interface Asset {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'font'
  path: string
  category: string | null
  metadata?: Record<string, unknown>
}

// Plugin types
export interface PluginManifest {
  name: string
  version: string
  description?: string
  author?: string
  type: string
  permissions: string[]
}

// Connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface PlatformStatus {
  platform: string
  status: ConnectionStatus
  lastConnected?: string
}

// Game Integration types
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

export type GameStatus = 'installed' | 'configured' | 'connected' | 'error' | 'disabled'

export type GameAdapterState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'disabled'

export interface GameAdapterConfig {
  bridgeType: 'websocket' | 'socket' | 'file'
  bridgeConfig: { host: string; port: number }
  autoConnect: boolean
  reconnectAttempts: number
  reconnectDelay: number
  customSettings: Record<string, unknown>
}

export interface GameCommand {
  action: string
  params: Record<string, unknown>
  timeout?: number
}

export interface GameCommandResult {
  success: boolean
  data?: unknown
  error?: string
  duration: number
}
