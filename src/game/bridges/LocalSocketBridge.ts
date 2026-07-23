import * as net from 'net'
import * as path from 'path'
import { Logger } from '@services/logger'
import { IGameBridge } from '../GameBridge'

const logger = new Logger('LocalSocketBridge')

/**
 * LocalSocketBridge - Named pipe / Unix socket communication
 * 
 * Connects to game mods via local socket.
 * 
 * Flow:
 *   Maulfinity (Client) ↔ Named Pipe/Unix Socket ↔ Game Mod (Server)
 * 
 * Usage:
 *   const bridge = new LocalSocketBridge({ path: '/tmp/game.sock', type: 'unix' })
 *   await bridge.connect()
 *   bridge.onMessage((data) => { ... })
 */
export class LocalSocketBridge implements IGameBridge {
  readonly type = 'socket' as const

  private socket: net.Socket | null = null
  private server: net.Server | null = null
  private config: { path: string; type: 'named_pipe' | 'unix' }
  private connected: boolean = false

  /** Message callbacks */
  private messageCallbacks: Array<(data: unknown) => void> = []

  /** Error callbacks */
  private errorCallbacks: Array<(error: Error) => void> = []

  /** Close callbacks */
  private closeCallbacks: Array<() => void> = []

  /** Buffer for incomplete messages */
  private buffer: string = ''

  constructor(config: { path: string; type: 'named_pipe' | 'unix' }) {
    this.config = config
  }

  /**
   * Connect to the socket server
   */
  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.socket = new net.Socket()

        const socketPath = this.config.type === 'named_pipe'
          ? `\\\\.\\pipe\\${this.config.path}`
          : this.config.path

        logger.info(`Connecting to socket: ${socketPath}`)

        this.socket.connect(socketPath, () => {
          this.connected = true
          logger.info('Socket connected')
          resolve(true)
        })

        this.socket.on('data', (data: Buffer) => {
          this.buffer += data.toString()

          // Process complete messages (newline-delimited JSON)
          const lines = this.buffer.split('\n')
          this.buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim()) {
              try {
                const parsed = JSON.parse(line)
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
            }
          }
        })

        this.socket.on('error', (error: Error) => {
          logger.error('Socket error', error)
          for (const callback of this.errorCallbacks) {
            callback(error)
          }
        })

        this.socket.on('close', () => {
          this.connected = false
          logger.info('Socket closed')
          for (const callback of this.closeCallbacks) {
            callback()
          }
        })

        // Connection timeout
        setTimeout(() => {
          if (!this.connected) {
            logger.error('Connection timeout')
            this.socket?.destroy()
            resolve(false)
          }
        }, 5000)
      } catch (error) {
        logger.error('Failed to create socket', error as Error)
        resolve(false)
      }
    })
  }

  /**
   * Disconnect from the socket
   */
  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.destroy()
      this.socket = null
    }

    this.connected = false
    logger.info('Socket disconnected')
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.socket !== null
  }

  /**
   * Send data to the server
   */
  async send(data: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error('Socket not connected'))
        return
      }

      const message = JSON.stringify(data) + '\n'

      this.socket.write(message, (error?: Error) => {
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
}
