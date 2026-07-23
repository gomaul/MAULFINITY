import { Logger } from '@services/logger'

const logger = new Logger('ConnectionState')

/**
 * All possible connection states
 */
export type ConnectionStateType =
  | 'disconnected'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'reconnecting'
  | 'error'

/**
 * Valid state transitions map
 * Key = current state, Value = array of valid next states
 */
const VALID_TRANSITIONS: Record<ConnectionStateType, ConnectionStateType[]> = {
  disconnected: ['connecting'],
  connecting: ['authenticating', 'connected', 'error', 'disconnected'],
  authenticating: ['connected', 'error', 'disconnected'],
  connected: ['reconnecting', 'disconnected', 'error'],
  reconnecting: ['connecting', 'connected', 'error', 'disconnected'],
  error: ['reconnecting', 'disconnected']
}

/**
 * ConnectionState - Finite State Machine for connector lifecycle
 *
 * Manages state transitions with validation and logging.
 * Ensures connectors only transition to valid states.
 *
 * Usage:
 *   const state = new ConnectionState('tiktok')
 *   state.transition('connecting')  // OK
 *   state.transition('connected')   // OK
 *   state.is('connected')           // true
 */
export class ConnectionState {
  private platform: string
  private current: ConnectionStateType
  private previous: ConnectionStateType | null = null
  private stateChangedAt: number
  private errorCount: number = 0
  private maxReconnectAttempts: number = 3

  constructor(platform: string, initialState: ConnectionStateType = 'disconnected') {
    this.platform = platform
    this.current = initialState
    this.stateChangedAt = Date.now()
    logger.debug(`[${platform}] Initial state: ${initialState}`)
  }

  /**
   * Attempt to transition to a new state
   * Returns true if transition was successful
   */
  transition(newState: ConnectionStateType): boolean {
    const validNextStates = VALID_TRANSITIONS[this.current]

    if (!validNextStates.includes(newState)) {
      logger.warning(
        `[${this.platform}] Invalid transition: ${this.current} → ${newState}. Valid: ${validNextStates.join(', ')}`
      )
      return false
    }

    this.previous = this.current
    this.current = newState
    this.stateChangedAt = Date.now()

    logger.info(`[${this.platform}] State: ${this.previous} → ${newState}`)

    // Reset error count on successful connection
    if (newState === 'connected') {
      this.errorCount = 0
    }

    // Increment error count on error
    if (newState === 'error') {
      this.errorCount++
    }

    return true
  }

  /**
   * Get current state
   */
  get(): ConnectionStateType {
    return this.current
  }

  /**
   * Get previous state
   */
  getPrevious(): ConnectionStateType | null {
    return this.previous
  }

  /**
   * Check if currently in a specific state
   */
  is(state: ConnectionStateType): boolean {
    return this.current === state
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.current === 'connected'
  }

  /**
   * Check if can attempt reconnection
   */
  canReconnect(): boolean {
    return this.errorCount < this.maxReconnectAttempts
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errorCount
  }

  /**
   * Get time spent in current state (ms)
   */
  getStateDuration(): number {
    return Date.now() - this.stateChangedAt
  }

  /**
   * Get timestamp of last state change
   */
  getStateChangedAt(): number {
    return this.stateChangedAt
  }

  /**
   * Set max reconnect attempts
   */
  setMaxReconnectAttempts(max: number): void {
    this.maxReconnectAttempts = max
  }

  /**
   * Reset state machine to initial state
   */
  reset(): void {
    this.previous = this.current
    this.current = 'disconnected'
    this.stateChangedAt = Date.now()
    this.errorCount = 0
    logger.info(`[${this.platform}] State reset to disconnected`)
  }

  /**
   * Get a snapshot of the current state info
   */
  getInfo(): {
    platform: string
    state: ConnectionStateType
    previous: ConnectionStateType | null
    errorCount: number
    stateDuration: number
  } {
    return {
      platform: this.platform,
      state: this.current,
      previous: this.previous,
      errorCount: this.errorCount,
      stateDuration: this.getStateDuration()
    }
  }
}
