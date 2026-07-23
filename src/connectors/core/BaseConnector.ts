import { EventEmitter } from 'events'
import { ConnectionState, ConnectionStateType } from './ConnectionState'
import { EventAdapter, PlatformEvent } from './EventAdapter'
import { EventBus } from '@core/event-bus/EventBus'
import { MaulfinityEvent } from '@core/event-bus/types'
import { Logger } from '@services/logger'

/**
 * Connector configuration interface
 */
export interface ConnectorConfig {
  platform: string
  username?: string
  autoReconnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  heartbeatInterval?: number
  [key: string]: unknown
}

/**
 * Connector statistics
 */
export interface ConnectorStats {
  platform: string
  state: ConnectionStateType
  eventsReceived: number
  eventsEmitted: number
  errors: number
  uptime: number
  lastEventAt: number | null
}

/**
 * BaseConnector - Abstract base class for all platform connectors
 *
 * Every connector (TikTok, YouTube, etc.) must extend this class
 * and implement the abstract methods.
 *
 * Provides:
 * - Connection state machine
 * - Automatic reconnection
 * - Event normalization via EventAdapter
 * - Heartbeat monitoring
 * - Event emission to EventBus
 *
 * Usage:
 *   class TikTokConnector extends BaseConnector { ... }
 */
export abstract class BaseConnector extends EventEmitter {
  protected platform: string
  protected config: ConnectorConfig
  protected state: ConnectionState
  protected eventAdapter: EventAdapter
  protected eventBus: EventBus
  protected logger: Logger
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private stats: {
    eventsReceived: number
    eventsEmitted: number
    errors: number
    lastEventAt: number | null
    startedAt: number
  }

  constructor(platform: string, config: ConnectorConfig) {
    super()
    this.platform = platform
    this.config = {
      autoReconnect: true,
      reconnectAttempts: 3,
      reconnectDelay: 5000,
      heartbeatInterval: 30000,
      ...config
    }
    this.state = new ConnectionState(platform)
    this.eventAdapter = new EventAdapter()
    this.eventBus = EventBus.getInstance()
    this.logger = new Logger(platform)
    this.stats = {
      eventsReceived: 0,
      eventsEmitted: 0,
      errors: 0,
      lastEventAt: null,
      startedAt: 0
    }
  }

  /**
   * Connect to the platform (must be implemented by subclass)
   */
  abstract connect(): Promise<void>

  /**
   * Disconnect from the platform (must be implemented by subclass)
   */
  abstract disconnect(): Promise<void>

  /**
   * Start connection with state management
   */
  async start(): Promise<void> {
    if (this.state.isConnected()) {
      this.logger.warning(`[${this.platform}] Already connected`)
      return
    }

    this.logger.info(`[${this.platform}] Starting connection...`)
    this.stats.startedAt = Date.now()

    try {
      this.state.transition('connecting')
      await this.connect()
      this.state.transition('connected')

      // Start heartbeat if configured
      if (this.config.heartbeatInterval && this.config.heartbeatInterval > 0) {
        this.startHeartbeat()
      }

      this.logger.info(`[${this.platform}] Connected successfully`)
      this.emit('connected', { platform: this.platform })
    } catch (error) {
      this.state.transition('error')
      this.stats.errors++
      this.logger.error(`[${this.platform}] Connection failed`, error as Error)
      this.emit('error', { platform: this.platform, error })

      // Auto-reconnect if enabled
      if (this.config.autoReconnect && this.state.canReconnect()) {
        this.scheduleReconnect()
      }
    }
  }

  /**
   * Stop connection with state management
   */
  async stop(): Promise<void> {
    this.logger.info(`[${this.platform}] Stopping connection...`)

    // Stop heartbeat
    this.stopHeartbeat()

    // Cancel reconnect timer
    this.cancelReconnect()

    try {
      await this.disconnect()
      this.state.transition('disconnected')
      this.logger.info(`[${this.platform}] Disconnected`)
      this.emit('disconnected', { platform: this.platform })
    } catch (error) {
      this.state.transition('error')
      this.stats.errors++
      this.logger.error(`[${this.platform}] Disconnect error`, error as Error)
    }
  }

  /**
   * Cancel pending reconnection
   */
  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()

    const interval = this.config.heartbeatInterval || 30000
    this.heartbeatTimer = setInterval(() => {
      this.onHeartbeat()
    }, interval)

    this.logger.debug(`[${this.platform}] Heartbeat started (${interval}ms)`)
  }

  /**
   * Stop heartbeat monitoring
   */
  protected stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * Schedule reconnection (protected so subclasses can trigger it)
   */
  protected scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    const delay = this.config.reconnectDelay || 5000
    this.logger.info(`[${this.platform}] Reconnecting in ${delay}ms...`)

    if (this.state.get() !== 'reconnecting') {
      this.state.transition('reconnecting')
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null
      await this.start()
    }, delay)
  }

  /**
   * Handle heartbeat tick (override in subclass if needed)
   */
  protected onHeartbeat(): void {
    if (!this.state.isConnected()) {
      this.logger.warning(`[${this.platform}] Heartbeat: not connected, attempting reconnect`)
      this.stopHeartbeat()
      if (this.config.autoReconnect) {
        this.scheduleReconnect()
      }
    }
  }

  /**
   * Emit a raw platform event (subclasses call this)
   * The event will be normalized and sent to EventBus
   */
  protected async emitPlatformEvent(type: string, user: string, data: Record<string, unknown>): Promise<void> {
    this.stats.eventsReceived++
    this.stats.lastEventAt = Date.now()

    const platformEvent: PlatformEvent = {
      platform: this.platform,
      type,
      user,
      data
    }

    // Normalize to MaulfinityEvent
    const normalizedEvent = this.eventAdapter.normalize(platformEvent)

    // Validate
    if (!this.eventAdapter.validate(normalizedEvent)) {
      this.logger.warning(`[${this.platform}] Invalid event rejected`)
      return
    }

    // Emit to EventBus
    try {
      await this.eventBus.emit(normalizedEvent)
      this.stats.eventsEmitted++

      // Log the event
      this.logger.info(
        `[${this.platform}] Event: ${normalizedEvent.type} | User: ${normalizedEvent.user} | Payload: ${JSON.stringify(normalizedEvent.payload)}`
      )

      // Emit locally for connector listeners
      this.emit('event', normalizedEvent)
    } catch (error) {
      this.stats.errors++
      this.logger.error(`[${this.platform}] Failed to emit event`, error as Error)
    }
  }

  /**
   * Get connection state
   */
  getState(): ConnectionStateType {
    return this.state.get()
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.isConnected()
  }

  /**
   * Get connector statistics
   */
  getStats(): ConnectorStats {
    return {
      platform: this.platform,
      state: this.state.get(),
      eventsReceived: this.stats.eventsReceived,
      eventsEmitted: this.stats.eventsEmitted,
      errors: this.stats.errors,
      uptime: this.stats.startedAt > 0 ? Date.now() - this.stats.startedAt : 0,
      lastEventAt: this.stats.lastEventAt
    }
  }

  /**
   * Get platform name
   */
  getPlatform(): string {
    return this.platform
  }

  /**
   * Get connector config
   */
  getConfig(): ConnectorConfig {
    return { ...this.config }
  }

  /**
   * Destroy the connector completely
   */
  async destroy(): Promise<void> {
    await this.stop()
    this.stopHeartbeat()
    this.removeAllListeners()
    this.logger.info(`[${this.platform}] Connector destroyed`)
  }
}
