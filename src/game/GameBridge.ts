/**
 * IGameBridge - Universal interface for game communication bridges
 * 
 * Bridges handle the raw communication between Maulfinity and game mods/plugins.
 * Supports: WebSocket, Local Socket, File Watcher
 * 
 * Flow:
 *   GameAdapter ↔ GameBridge ↔ External Game
 */
export interface IGameBridge {
  /** Bridge type identifier */
  readonly type: 'websocket' | 'socket' | 'file'

  /** Connect to the game */
  connect(): Promise<boolean>

  /** Disconnect from the game */
  disconnect(): Promise<void>

  /** Check if connected */
  isConnected(): boolean

  /** Send data to the game */
  send(data: unknown): Promise<unknown>

  /** Register message callback */
  onMessage(callback: (data: unknown) => void): void

  /** Register error callback */
  onError(callback: (error: Error) => void): void

  /** Register close callback */
  onClose(callback: () => void): void

  /** Remove all listeners */
  removeAllListeners(): void
}

/**
 * Bridge connection options
 */
export interface BridgeConnectOptions {
  host?: string
  port?: number
  path?: string
  timeout?: number
  [key: string]: unknown
}
