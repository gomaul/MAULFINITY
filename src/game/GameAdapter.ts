import { GameRawEvent, GameCommand, GameCommandResult, GameAdapterConfig, GameAdapterState, GameAdapterStats, GameInfo, GameEventCallback, GameState, StateChangeCallback } from './types'

/**
 * IGameAdapter - Universal interface for all game adapters
 * 
 * Every game adapter must implement this interface.
 * Provides:
 * - Connection lifecycle management
 * - Event subscription and emission
 * - Command execution
 * - State tracking
 * 
 * Flow:
 *   Game → GameAdapter → GameBridge → EventNormalizer → EventBus
 */
export interface IGameAdapter {
  // Identity
  readonly gameId: string
  readonly gameName: string
  readonly version: string
  readonly author: string

  // Lifecycle
  connect(): Promise<boolean>
  disconnect(): Promise<void>
  isConnected(): boolean
  getState(): GameAdapterState

  // Game Information
  getGameInfo(): GameInfo
  getSupportedEvents(): string[]
  getSupportedCommands(): string[]

  // Event Handling
  subscribeEvents(callback: GameEventCallback): void
  unsubscribeEvents(callback: GameEventCallback): void

  // Command Execution
  sendCommand(command: GameCommand): Promise<GameCommandResult>

  // State
  getGameState(): GameState
  onStateChange(callback: StateChangeCallback): void

  // Configuration
  configure(config: GameAdapterConfig): void
  getConfig(): GameAdapterConfig

  // Statistics
  getStats(): GameAdapterStats

  // Cleanup
  destroy(): Promise<void>
}
