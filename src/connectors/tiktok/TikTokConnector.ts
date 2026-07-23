import WebSocket from 'ws'
import { BaseConnector, ConnectorConfig } from '../core/BaseConnector'
import { TikTokConfig, DEFAULT_TIKTOK_CONFIG } from './TikTokConfig'
import { TikTokParser, ParsedTikTokEvent } from './TikTokParser'
import { Logger } from '@services/logger'

const logger = new Logger('TikTokConnector')

/**
 * TikTok LIVE WebSocket URL format
 */
const TIKTOK_WS_URL = 'wss://webcast5-ws-web-lf.tiktok.com/webcast/im/push/v2/'

/**
 * TikTokConnector - Connects to TikTok LIVE via WebSocket
 *
 * Receives real-time events from TikTok LIVE streams:
 * - Gifts
 * - Comments
 * - Follows
 * - Likes
 * - Shares
 * - Joins
 *
 * All events are normalized via EventAdapter and emitted to EventBus.
 *
 * Usage:
 *   const connector = new TikTokConnector({
 *     platform: 'tiktok',
 *     username: 'gomaul'
 *   })
 *   await connector.start()
 */
export class TikTokConnector extends BaseConnector {
  private tiktokConfig: TikTokConfig
  private parser: TikTokParser
  private ws: WebSocket | null = null
  private roomId: string = ''
  private pingTimer: ReturnType<typeof setInterval> | null = null

  constructor(config: ConnectorConfig) {
    super('tiktok', config)

    this.tiktokConfig = {
      ...DEFAULT_TIKTOK_CONFIG,
      ...config
    } as TikTokConfig

    this.parser = new TikTokParser()
  }

  /**
   * Connect to TikTok LIVE
   */
  async connect(): Promise<void> {
    this.logger.info(`[tiktok] Connecting as ${this.tiktokConfig.username}...`)

    // Step 1: Get room ID from username
    this.roomId = await this.fetchRoomId(this.tiktokConfig.username)
    this.logger.info(`[tiktok] Room ID: ${this.roomId}`)

    // Step 2: Establish WebSocket connection
    await this.connectWebSocket()
  }

  /**
   * Disconnect from TikTok LIVE
   */
  async disconnect(): Promise<void> {
    this.logger.info('[tiktok] Disconnecting...')

    this.stopHeartbeat()
    this.stopPing()

    if (this.ws) {
      this.ws.close(1000, 'User disconnect')
      this.ws = null
    }

    this.logger.info('[tiktok] Disconnected')
  }

  /**
   * Fetch room ID from username using TikTok's web API
   */
  private async fetchRoomId(username: string): Promise<string> {
    try {
      // Use TikTok's web API to get room info
      const url = `https://www.tiktok.com/@${username}/live`
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const html = await response.text()

      // Extract room ID from page source
      const roomMatch = html.match(/roomId['":\s]+['"](\d+)['"]/)
      if (roomMatch) {
        return roomMatch[1]
      }

      // Alternative: try looking for room_id in script tags
      const altMatch = html.match(/room_id['":\s]+(\d+)/)
      if (altMatch) {
        return altMatch[1]
      }

      throw new Error(`Could not find room ID for user: ${username}`)
    } catch (error) {
      this.logger.error(`[tiktok] Failed to fetch room ID for ${username}`, error as Error)
      throw error
    }
  }

  /**
   * Establish WebSocket connection
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${TIKTOK_WS_URL}?app_name=tiktok_web&channel=webcast&...`

      this.ws = new WebSocket(wsUrl)

      let settled = false

      this.ws.on('open', () => {
        if (settled) return
        settled = true
        this.logger.info('[tiktok] WebSocket connected')
        this.startPing()
        resolve()
      })

      this.ws.on('message', async (data: WebSocket.Data) => {
        await this.handleMessage(data)
      })

      this.ws.on('close', (code: number, reason: Buffer) => {
        this.logger.info(`[tiktok] WebSocket closed: ${code} ${reason.toString()}`)
        this.stopPing()
        this.ws = null

        // Check if this was an intentional disconnect
        if (this.state.get() === 'disconnected') return

        // Unexpected close — trigger BaseConnector reconnection
        if (this.config.autoReconnect && this.state.canReconnect()) {
          this.scheduleReconnect()
        }
      })

      this.ws.on('error', (error: Error) => {
        this.logger.error('[tiktok] WebSocket error', error)
        reject(error)
      })

      // Timeout
      setTimeout(() => {
        if (settled) return
        settled = true
        reject(new Error('WebSocket connection timeout'))
      }, 10000)
    })
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(data: WebSocket.Data): Promise<void> {
    try {
      // Parse the message
      const events = this.parser.parse(data)

      // Process each event
      for (const event of events) {
        await this.processEvent(event)
      }
    } catch (error) {
      this.logger.error('[tiktok] Failed to handle message', error as Error)
    }
  }

  /**
   * Process a parsed TikTok event
   */
  private async processEvent(event: ParsedTikTokEvent): Promise<void> {
    this.logger.debug(`[tiktok] Received: ${event.type} from ${event.user}`)

    // Emit to EventBus via BaseConnector
    await this.emitPlatformEvent(event.type, event.user, event.data)
  }

  // TikTok-specific heartbeat is handled by BaseConnector.onHeartbeat()
  // No need for separate heartbeat timer here

  /**
   * Start ping timer
   */
  private startPing(): void {
    this.stopPing()

    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping()
      }
    }, 10000)
  }

  /**
   * Stop ping timer
   */
  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  /**
   * Get room ID
   */
  getRoomId(): string {
    return this.roomId
  }


}
