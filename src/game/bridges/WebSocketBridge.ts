import WebSocket from 'ws'
import { Logger } from '@services/logger'
import { IGameBridge } from '../GameBridge'

const logger = new Logger('WebSocketBridge')

/**
 * WebSocketBridge - WebSocket-based game communication
 * 
 * Connects to game mods/plugins via WebSocket.
 * 
 * Flow:
 *   Maulfinity (Client) ↔ WebSocket ↔ Game Plugin (Server)
 * 
 * Usage:
 *   const bridge = new WebSocketBridge({ host: 'localhost', port: 8765 })
 *   await bridge.connect()
 *   bridge.onMessage((data) => { ... })
 *   await bridge.send({ action: 'spawn.vehicle', params: { model: 'adder' } })
 */
export class WebSocketBridge implements IGameBridge {
  readonly type = 'websocket' as const

  private ws: WebSocket | null = null
  private config: { host: string; port: number; path?: string; secure?: boolean }
  private connected: boolean = false

  /** Message callbacks */
  private messageCallbacks: Array<(data: unknown) => void> = []

  /** Error callbacks */
  private errorCallbacks: Array<(error: Error) => void> = []

  /** Close callbacks */
  private closeCallbacks: Array<() => void> = []

  /** Reconnection */
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 3000

  constructor(config: { host: string; port: number; path?: string; secure?: boolean }) {
    this.config = config
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const protocol = this.config.secure ? 'wss' : 'ws'
        const url = `${protocol}://${this.config.host}:${this.config.port}${this.config.path || ''}`

        logger.info(`Connecting to ${url}`)

        this.ws = new WebSocket(url)

        this.ws.on('open', () => {
          this.connected = true
          this.reconnectAttempts = 0
          logger.info('WebSocket connected')
          resolve(true)
        })

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const parsed = JSON.parse(data.toString())
            for (const callback of this.messageCallbacks) {
              try {
                callback(parsed)
              } catch (error) {
                logger.error('Error in message callback', error as Error)
              }
            }
          } catch (error) {
            logger.error('Failed to parse message', error as Error)
          }
        })

        this.ws.on('error', (error: Error) => {
          logger.error('WebSocket error', error)
          for (const callback of this.errorCallbacks) {
            callback(error)
          }
        })

        this.ws.on('close', () => {
          this.connected = false
          logger.info('WebSocket closed')
          for (const callback of this.closeCallbacks) {
            callback()
          }
          this.attemptReconnect()
        })

        // Connection timeout
        setTimeout(() => {
          if (!this.connected) {
            logger.error('Connection timeout')
            resolve(false)
          }
        }, 5000)
      } catch (error) {
        logger.error('Failed to create WebSocket', error as Error)
        resolve(false)
      }
    })
  }

  /**
   * Disconnect from the WebSocket server
   */
  async disconnect(): Promise<void> {
    this.cancelReconnect()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.connected = false
    logger.info('WebSocket disconnected')
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Send data to the server
   */
  async send(data: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.isConnected()) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const message = JSON.stringify(data)

      this.ws.send(message, (error?: Error) => {
        if (error) {
          reject(error)
        } else {
          resolve(undefined)
        }
      })
    })
  }

  /**
   * Register message callback
   */
  onMessage(callback: (data: unknown) => void): void {
    this.messageCallbacks.push(callback)
  }

  /**
   * Register error callback
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback)
  }

  /**
   * Register close callback
   */
  onClose(callback: () => void): void {
    this.closeCallbacks.push(callback)
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.messageCallbacks = []
    this.errorCallbacks = []
    this.closeCallbacks = []
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.warning('Max reconnect attempts reached')
      return
    }

    if (this.reconnectTimer) return

    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts

    logger.info(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)

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
    this.reconnectAttempts = 0
  }
}
