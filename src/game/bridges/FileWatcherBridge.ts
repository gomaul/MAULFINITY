import * as fs from 'fs'
import * as path from 'path'
import { Logger } from '@services/logger'
import { IGameBridge } from '../GameBridge'

const logger = new Logger('FileWatcherBridge')

/**
 * FileWatcherBridge - File-based game communication
 * 
 * Communicates with games by watching directories for JSON files.
 * 
 * Flow:
 *   Game Mod writes event file → Maulfinity watches → Reads & processes
 *   Maulfinity writes command file → Game Mod watches → Reads & processes
 * 
 * Usage:
 *   const bridge = new FileWatcherBridge({
 *     watchDir: '/tmp/game/events',
 *     eventDir: '/tmp/game/events',
 *     responseDir: '/tmp/game/responses'
 *   })
 *   await bridge.connect()
 *   bridge.onMessage((data) => { ... })
 */
export class FileWatcherBridge implements IGameBridge {
  readonly type = 'file' as const

  private config: {
    watchDir: string
    eventDir: string
    responseDir: string
    pollInterval?: number
  }
  private connected: boolean = false

  /** Message callbacks */
  private messageCallbacks: Array<(data: unknown) => void> = []

  /** Error callbacks */
  private errorCallbacks: Array<(error: Error) => void> = []

  /** Close callbacks */
  private closeCallbacks: Array<() => void> = []

  /** File watcher */
  private watcher: fs.FSWatcher | null = null

  /** Poll timer for fallback */
  private pollTimer: ReturnType<typeof setInterval> | null = null

  /** Processed files to avoid duplicates */
  private processedFiles: Set<string> = new Set()

  constructor(config: {
    watchDir: string
    eventDir: string
    responseDir: string
    pollInterval?: number
  }) {
    this.config = config
  }

  /**
   * Connect and start watching
   */
  async connect(): Promise<boolean> {
    try {
      // Ensure directories exist
      this.ensureDirectory(this.config.watchDir)
      this.ensureDirectory(this.config.eventDir)
      this.ensureDirectory(this.config.responseDir)

      // Start watching for new files
      this.watcher = fs.watch(this.config.watchDir, (eventType, filename) => {
        if (eventType === 'rename' && filename) {
          this.processFile(path.join(this.config.watchDir, filename))
        }
      })

      this.watcher.on('error', (error: Error) => {
        logger.error('Watcher error', error)
        for (const callback of this.errorCallbacks) {
          callback(error)
        }
      })

      // Also set up polling as fallback
      this.pollTimer = setInterval(() => {
        this.pollDirectory()
      }, this.config.pollInterval || 1000)

      this.connected = true
      logger.info(`FileWatcher connected, watching: ${this.config.watchDir}`)
      return true
    } catch (error) {
      logger.error('Failed to connect FileWatcher', error as Error)
      return false
    }
  }

  /**
   * Disconnect and stop watching
   */
  async disconnect(): Promise<void> {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }

    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }

    this.connected = false
    this.processedFiles.clear()

    logger.info('FileWatcher disconnected')
    for (const callback of this.closeCallbacks) {
      callback()
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * Send data by writing a file
   */
  async send(data: unknown): Promise<unknown> {
    const filename = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`
    const filepath = path.join(this.config.responseDir, filename)

    try {
      const content = JSON.stringify(data, null, 2)
      fs.writeFileSync(filepath, content, 'utf-8')
      logger.debug(`Wrote command file: ${filename}`)
      return undefined
    } catch (error) {
      logger.error('Failed to write command file', error as Error)
      throw error
    }
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
   * Process a file
   */
  private async processFile(filepath: string): Promise<void> {
    // Skip if already processed
    if (this.processedFiles.has(filepath)) return

    // Check if file exists
    if (!fs.existsSync(filepath)) return

    // Wait a bit for file to be fully written
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const content = fs.readFileSync(filepath, 'utf-8')
      const data = JSON.parse(content)

      this.processedFiles.add(filepath)

      // Notify callbacks
      for (const callback of this.messageCallbacks) {
        try {
          callback(data)
        } catch (error) {
          logger.error('Error in message callback', error as Error)
        }
      }

      // Clean up processed file
      try {
        fs.unlinkSync(filepath)
        this.processedFiles.delete(filepath)
      } catch {
        // Ignore cleanup errors
      }
    } catch (error) {
      logger.error(`Failed to process file: ${filepath}`, error as Error)
    }
  }

  /**
   * Poll directory for new files
   */
  private pollDirectory(): void {
    try {
      const files = fs.readdirSync(this.config.watchDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          this.processFile(path.join(this.config.watchDir, file))
        }
      }
    } catch {
      // Ignore polling errors
    }
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }
}
