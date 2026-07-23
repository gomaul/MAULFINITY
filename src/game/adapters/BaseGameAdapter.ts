import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import { EventBus } from '@core/event-bus/EventBus'
import { IGameBridge } from '../GameBridge'
import {
  IGameAdapter,
  GameRawEvent,
  GameCommand,
  GameCommandResult,
  GameAdapterConfig,
  GameAdapterState,
  GameAdapterStats,
  GameInfo,
  GameEventCallback,
  GameState,
  StateChangeCallback,
  DEFAULT_ADAPTER_CONFIG
} from '../types'

/**
 * ConnectionState - Simple state machine for game adapter
 */
class AdapterConnectionState {
  private current: GameAdapterState = 'disconnected'
  private errorCount: number = 0
  private maxReconnectAttempts: number

  constructor(maxReconnect: number = 3) {
    this.maxReconnectAttempts = maxReconnect
  }

  get(): GameAdapterState {
    return this.current
  }

  set(state: GameAdapterState): void {
    this.current = state
    if (state === 'connected') {
      this.errorCount = 0
    }
    if (state === 'error') {
      this.errorCount++
    }
  }

  isConnected(): boolean {
    return this.current === 'connected'
  }

  canReconnect(): boolean {
    return this.errorCount < this.maxReconnectAttempts
  }

  reset(): void {
    this.current = 'disconnected'
    this.errorCount = 0
  }
}

/**
 * BaseGameAdapter - Abstract base class for all game adapters
 * 
 * Provides:
 * - Connection state management
 * - Event callback management
 * - Statistics tracking
 * - Bridge integration
 * 
 * Usage:
 *   class GTAAdapter extends BaseGameAdapter { ... }
 */
export abstract class BaseGameAdapter extends EventEmitter implements IGameAdapter {
  abstract readonly gameId: string
  abstract readonly gameName: string
  abstract readonly version: string
  abstract readonly author: string

  protected config: GameAdapterConfig
  protected state: AdapterConnectionState
  protected bridge: IGameBridge | null = null
  protected eventBus: EventBus
  protected logger: Logger

  /** Event callbacks */
  private eventCallbacks: GameEventCallback[] = []

  /** State change callbacks */
  private stateCallbacks: StateChangeCallback[] = []

  /** Game state */
  private gameState: GameState

  /** Statistics */
  private stats: GameAdapterStats

  /** Reconnect timer */
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  /** Started timestamp */
  private startedAt: number = 0

  constructor(gameId: string, config: GameAdapterConfig) {
    super()
    this.config = { ...DEFAULT_ADAPTER_CONFIG, ...config }
    this.state = new AdapterConnectionState(this.config.reconnectAttempts)
    this.eventBus = EventBus.getInstance()
    this.logger = new Logger(`GameAdapter:${gameId}`)

    // Initialize game state
    this.gameState = {
      gameId,
      timestamp: Date.now(),
      connected: false,
      players: new Map(),
      vehicles: new Map(),
      world: {
        weather: 'clear',
        time: { hour: 12, minute: 0 },
        area: 'unknown',
        isNight: false
      }
    }

    // Initialize statistics
    this.stats = {
      gameId,
      state: 'disconnected',
      eventsReceived: 0,
      eventsEmitted: 0,
      commandsExecuted: 0,
      commandsFailed: 0,
      errors: 0,
      uptime: 0,
      lastEventAt: null,
      lastCommandAt: null
    }
  }

  // ============================================================
  // ABSTRACT METHODS (Must be implemented by subclasses)
  // ============================================================

  abstract getGameInfo(): GameInfo
  abstract getSupportedEvents(): string[]
  abstract getSupportedCommands(): string[]

  /**
   * Connect to the game (implemented by subclass)
   */
  protected abstract connectToGame(): Promise<boolean>

  /**
   * Disconnect from the game (implemented by subclass)
   */
  protected abstract disconnectFromGame(): Promise<void>

  /**
   * Send command to the game (implemented by subclass)
   */
  protected abstract sendCommandToGame(command: GameCommand): Promise<GameCommandResult>

  // ============================================================
  // LIFECYCLE
  // ============================================================

  /**
   * Connect to the game
   */
  async connect(): Promise<boolean> {
    if (this.state.isConnected()) {
      this.logger.warning('Already connected')
      return true
    }

    this.logger.info('Connecting...')
    this.state.set('connecting')
    this.updateStats()

    try {
      const connected = await this.connectToGame()

      if (connected) {
        this.state.set('connected')
        this.gameState.connected = true
        this.gameState.timestamp = Date.now()
        this.startedAt = Date.now()
        this.updateStats()

        this.logger.info('Connected successfully')
        this.emit('connected', { gameId: this.gameId })

        return true
      }

      this.state.set('error')
      this.updateStats()
      this.scheduleReconnect()
      return false
    } catch (error) {
      this.state.set('error')
      this.stats.errors++
      this.updateStats()
      this.logger.error('Connection failed', error as Error)
      this.emit('error', { gameId: this.gameId, error })

      if (this.config.autoConnect) {
        this.scheduleReconnect()
      }

      return false
    }
  }

  /**
   * Disconnect from the game
   */
  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting...')

    this.cancelReconnect()

    try {
      await this.disconnectFromGame()
    } catch (error) {
      this.logger.error('Disconnect error', error as Error)
    }

    this.state.set('disconnected')
    this.gameState.connected = false
    this.gameState.timestamp = Date.now()
    this.updateStats()

    this.logger.info('Disconnected')
    this.emit('disconnected', { gameId: this.gameId })
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.isConnected()
  }

  /**
   * Get adapter state
   */
  getState(): GameAdapterState {
    return this.state.get()
  }

  // ============================================================
  // EVENT HANDLING
  // ============================================================

  /**
   * Subscribe to game events
   */
  subscribeEvents(callback: GameEventCallback): void {
    this.eventCallbacks.push(callback)
  }

  /**
   * Unsubscribe from game events
   */
  unsubscribeEvents(callback: GameEventCallback): void {
    const index = this.eventCallbacks.indexOf(callback)
    if (index > -1) {
      this.eventCallbacks.splice(index, 1)
    }
  }

  /**
   * Emit a raw game event (called by subclass when game sends event)
   */
  protected emitGameEvent(type: string, data: Record<string, unknown>): void {
    const rawEvent: GameRawEvent = {
      type,
      timestamp: Date.now(),
      data
    }

    this.stats.eventsReceived++
    this.stats.lastEventAt = Date.now()
    this.updateStats()

    // Notify all callbacks
    for (const callback of this.eventCallbacks) {
      try {
        callback(rawEvent)
      } catch (error) {
        this.logger.error('Error in event callback', error as Error)
      }
    }
  }

  // ============================================================
  // COMMAND EXECUTION
  // ============================================================

  /**
   * Send a command to the game
   */
  async sendCommand(command: GameCommand): Promise<GameCommandResult> {
    if (!this.state.isConnected()) {
      return {
        success: false,
        error: 'Not connected',
        duration: 0
      }
    }

    const startTime = Date.now()

    try {
      this.logger.debug(`Sending command: ${command.action}`)
      const result = await this.sendCommandToGame(command)

      this.stats.commandsExecuted++
      this.stats.lastCommandAt = Date.now()
      this.updateStats()

      this.logger.debug(`Command completed: ${command.action} in ${result.duration}ms`)
      return result
    } catch (error) {
      this.stats.commandsFailed++
      this.updateStats()

      this.logger.error(`Command failed: ${command.action}`, error as Error)
      return {
        success: false,
        error: (error as Error).message,
        duration: Date.now() - startTime
      }
    }
  }

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  /**
   * Get current game state
   */
  getGameState(): GameState {
    return { ...this.gameState }
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: StateChangeCallback): void {
    this.stateCallbacks.push(callback)
  }

  /**
   * Notify state change subscribers
   */
  protected notifyStateChange(update: unknown): void {
    for (const callback of this.stateCallbacks) {
      try {
        callback(update as import('../types').StateUpdate)
      } catch (error) {
        this.logger.error('Error in state callback', error as Error)
      }
    }
  }

  // ============================================================
  // CONFIGURATION
  // ============================================================

  /**
   * Update configuration
   */
  configure(config: Partial<GameAdapterConfig>): void {
    this.config = { ...this.config, ...config }
    this.logger.debug('Configuration updated')
  }

  /**
   * Get configuration
   */
  getConfig(): GameAdapterConfig {
    return { ...this.config }
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  /**
   * Get adapter statistics
   */
  getStats(): GameAdapterStats {
    return { ...this.stats }
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.state = this.state.get()
    this.stats.uptime = this.startedAt > 0 ? Date.now() - this.startedAt : 0
  }

  // ============================================================
  // RECONNECTION
  // ============================================================

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (!this.config.autoConnect) return
    if (!this.state.canReconnect()) {
      this.logger.warning('Max reconnect attempts reached')
      return
    }
    if (this.reconnectTimer) return

    const delay = this.config.reconnectDelay || 5000
    this.logger.info(`Reconnecting in ${delay}ms...`)

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null
      await this.connect()
    }, delay)
  }

  /**
   * Cancel reconnection
   */
  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  /**
   * Destroy the adapter
   */
  async destroy(): Promise<void> {
    await this.disconnect()
    this.cancelReconnect()
    this.eventCallbacks = []
    this.stateCallbacks = []
    this.removeAllListeners()
    this.logger.info('Adapter destroyed')
  }
}
