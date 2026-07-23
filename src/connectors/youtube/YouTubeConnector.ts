import { BaseConnector, ConnectorConfig } from '../core/BaseConnector'
import { YouTubeConfig, DEFAULT_YOUTUBE_CONFIG } from './YouTubeConfig'
import { YouTubeParser, ParsedYouTubeEvent } from './YouTubeParser'
import { Logger } from '@services/logger'

const logger = new Logger('YouTubeConnector')

/**
 * YouTube Live Chat API base URL
 */
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

/**
 * YouTubeConnector - Connects to YouTube Live Chat
 *
 * Receives real-time events from YouTube Live streams:
 * - Live chat messages (comments)
 * - Super Chats
 * - Super Stickers
 * - Memberships
 *
 * All events are normalized via EventAdapter and emitted to EventBus.
 *
 * Note: Requires YouTube Data API v3 key for production use.
 * For development, uses polling-based Live Chat API.
 *
 * Usage:
 *   const connector = new YouTubeConnector({
 *     platform: 'youtube',
 *     apiKey: 'YOUR_API_KEY'
 *   })
 *   await connector.start()
 */
export class YouTubeConnector extends BaseConnector {
  private ytConfig: YouTubeConfig
  private parser: YouTubeParser
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private nextPageToken: string = ''
  private pollingInterval: number = 5000
  private cachedLiveChatId: string = ''

  constructor(config: ConnectorConfig) {
    super('youtube', config)

    this.ytConfig = {
      ...DEFAULT_YOUTUBE_CONFIG,
      ...config
    } as YouTubeConfig

    this.parser = new YouTubeParser()
  }

  /**
   * Connect to YouTube Live Chat
   */
  async connect(): Promise<void> {
    this.logger.info('[youtube] Connecting to YouTube Live Chat...')

    if (!this.ytConfig.apiKey) {
      this.logger.warning('[youtube] No API key provided. Using demo mode.')
      this.logger.info('[youtube] To connect for real, provide an API key in config.')
    }

    if (!this.ytConfig.channelId && !this.ytConfig.streamId) {
      this.logger.warning('[youtube] No channelId or streamId provided. Using demo mode.')
    }

    // Step 1: Get active live stream
    if (this.ytConfig.apiKey && this.ytConfig.channelId) {
      this.ytConfig.streamId = await this.getActiveStreamId()
    }

    // Step 2: Start polling
    this.startPolling()

    this.logger.info('[youtube] Connected successfully')
  }

  /**
   * Disconnect from YouTube Live Chat
   */
  async disconnect(): Promise<void> {
    this.logger.info('[youtube] Disconnecting...')

    this.stopPolling()
    this.nextPageToken = ''
    this.cachedLiveChatId = ''

    this.logger.info('[youtube] Disconnected')
  }

  /**
   * Get active live stream ID for a channel
   */
  private async getActiveStreamId(): Promise<string> {
    try {
      const url = `${YOUTUBE_API_BASE}/search?` +
        `part=snippet&channelId=${this.ytConfig.channelId}` +
        `&type=live&key=${this.ytConfig.apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.items && data.items.length > 0) {
        return data.items[0].id.videoId
      }

      throw new Error('No active live stream found')
    } catch (error) {
      this.logger.error('[youtube] Failed to get active stream', error as Error)
      throw error
    }
  }

  /**
   * Get live chat ID from stream ID
   */
  private async getLiveChatId(): Promise<string> {
    try {
      const url = `${YOUTUBE_API_BASE}/videos?` +
        `part=liveStreamingDetails&id=${this.ytConfig.streamId}` +
        `&key=${this.ytConfig.apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.items && data.items.length > 0) {
        return data.items[0].liveStreamingDetails.activeLiveChatId
      }

      throw new Error('No live chat found for stream')
    } catch (error) {
      this.logger.error('[youtube] Failed to get live chat ID', error as Error)
      throw error
    }
  }

  /**
   * Start polling for live chat messages
   */
  private startPolling(): void {
    this.stopPolling()

    this.pollTimer = setInterval(async () => {
      await this.pollMessages()
    }, this.pollingInterval)

    this.logger.info(`[youtube] Polling started (${this.pollingInterval}ms interval)`)
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  /**
   * Poll for new messages
   */
  private async pollMessages(): Promise<void> {
    try {
      if (!this.ytConfig.apiKey || !this.ytConfig.streamId) {
        // Demo mode: no real polling
        return
      }

      if (!this.cachedLiveChatId) {
        this.cachedLiveChatId = await this.getLiveChatId()
      }
      const liveChatId = this.cachedLiveChatId

      let url = `${YOUTUBE_API_BASE}/liveChat/messages?` +
        `part=snippet,authorDetails&liveChatId=${liveChatId}` +
        `&key=${this.ytConfig.apiKey}`

      if (this.nextPageToken) {
        url += `&pageToken=${this.nextPageToken}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.items) {
        // Process messages
        const events = this.parser.parse(data)
        for (const event of events) {
          await this.processEvent(event)
        }
      }

      // Update next page token
      if (data.nextPageToken) {
        this.nextPageToken = data.nextPageToken
      }

      // Update polling interval based on API response
      if (data.pollingIntervalMillis) {
        this.pollingInterval = data.pollingIntervalMillis
        this.restartPolling()
      }
    } catch (error) {
      this.logger.error('[youtube] Poll error', error as Error)
    }
  }

  /**
   * Restart polling with updated interval
   */
  private restartPolling(): void {
    this.stopPolling()
    this.startPolling()
  }

  /**
   * Process a parsed YouTube event
   */
  private async processEvent(event: ParsedYouTubeEvent): Promise<void> {
    this.logger.debug(`[youtube] Received: ${event.type} from ${event.user}`)

    // Emit to EventBus via BaseConnector
    await this.emitPlatformEvent(event.type, event.user, event.data)
  }



  /**
   * Get stream ID
   */
  getStreamId(): string | undefined {
    return this.ytConfig.streamId
  }

  /**
   * Get channel ID
   */
  getChannelId(): string | undefined {
    return this.ytConfig.channelId
  }
}
