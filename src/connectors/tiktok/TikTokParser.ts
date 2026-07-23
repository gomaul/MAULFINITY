import { Logger } from '@services/logger'

const logger = new Logger('TikTokParser')

/**
 * TikTokParser - Parses raw TikTok WebSocket data into structured events
 *
 * Handles the TikTok LIVE protocol message format and extracts
 * meaningful events (gifts, comments, follows, etc.)
 *
 * Usage:
 *   const parser = new TikTokParser()
 *   const events = parser.parse(rawData)
 */
export class TikTokParser {
  private logger: Logger

  constructor() {
    this.logger = new Logger('TikTokParser')
  }

  /**
   * Parse raw WebSocket message into structured events
   */
  parse(data: unknown): ParsedTikTokEvent[] {
    try {
      // Handle string data (JSON)
      if (typeof data === 'string') {
        data = JSON.parse(data)
      }

      // Handle buffer data
      if (data instanceof Buffer) {
        data = JSON.parse(data.toString('utf-8'))
      }

      // Handle ArrayBuffer
      if (data instanceof ArrayBuffer) {
        data = JSON.parse(new TextDecoder().decode(data))
      }

      const messages = this.extractMessages(data)
      const events: ParsedTikTokEvent[] = []

      for (const msg of messages) {
        const event = this.parseMessage(msg)
        if (event) {
          events.push(event)
        }
      }

      return events
    } catch (error) {
      this.logger.error('Failed to parse TikTok data', error as Error)
      return []
    }
  }

  /**
   * Extract messages array from various response formats
   */
  private extractMessages(data: unknown): unknown[] {
    if (!data || typeof data !== 'object') return []

    const obj = data as Record<string, unknown>

    // Direct messages array
    if (Array.isArray(obj.messages)) {
      return obj.messages
    }

    // Single message
    if (obj.type !== undefined) {
      return [data]
    }

    // Nested data
    if (obj.data && typeof obj.data === 'object') {
      const nested = obj.data as Record<string, unknown>
      if (Array.isArray(nested.messages)) {
        return nested.messages
      }
    }

    return []
  }

  /**
   * Parse a single TikTok message
   */
  private parseMessage(msg: unknown): ParsedTikTokEvent | null {
    if (!msg || typeof msg !== 'object') return null

    const message = msg as Record<string, unknown>
    const messageType = message.type as string | undefined
    const body = message.body as Record<string, unknown> | undefined
    const user = this.extractUser(message)

    if (!messageType) return null

    switch (messageType) {
      case 'webcastGiftMessage':
        return this.parseGift(body, user)

      case 'webcastChatMessage':
        return this.parseComment(body, user)

      case 'webcastSocialMessage':
        return this.parseSocial(body, user)

      case 'webcastMemberMessage':
        return this.parseJoin(body, user)

      case 'webcastLikeMessage':
        return this.parseLike(body, user)

      default:
        this.logger.debug(`Unknown TikTok message type: ${messageType}`)
        return null
    }
  }

  /**
   * Extract user info from message
   */
  private extractUser(message: Record<string, unknown>): string {
    // Try common user fields
    const user = message.user as Record<string, unknown> | undefined
    if (user) {
      return (user.nickname as string) || (user.uniqueId as string) || 'unknown'
    }

    // Try sender
    const sender = message.sender as Record<string, unknown> | undefined
    if (sender) {
      return (sender.nickname as string) || 'unknown'
    }

    return 'unknown'
  }

  /**
   * Parse gift event
   */
  private parseGift(body: Record<string, unknown> | undefined, user: string): ParsedTikTokEvent | null {
    if (!body) return null

    return {
      type: 'gift',
      user,
      data: {
        giftName: (body.giftName as string) || 'unknown',
        repeatCount: (body.repeatCount as number) || 1,
        diamondCount: (body.diamondCount as number) || 0,
        combo: (body.combo as boolean) || false
      }
    }
  }

  /**
   * Parse comment event
   */
  private parseComment(body: Record<string, unknown> | undefined, user: string): ParsedTikTokEvent | null {
    if (!body) return null

    return {
      type: 'comment',
      user,
      data: {
        text: (body.comment as string) || ''
      }
    }
  }

  /**
   * Parse social event (follow/share)
   */
  private parseSocial(body: Record<string, unknown> | undefined, user: string): ParsedTikTokEvent | null {
    if (!body) return null

    const shareType = body.shareType as number | undefined

    // shareType 1 = follow, 7 = share
    if (shareType === 1) {
      return { type: 'follow', user, data: {} }
    }

    return { type: 'share', user, data: {} }
  }

  /**
   * Parse join event
   */
  private parseJoin(body: Record<string, unknown> | undefined, user: string): ParsedTikTokEvent | null {
    if (!body) return null

    return {
      type: 'join',
      user,
      data: {
        viewerCount: (body.viewerCount as number) || 0
      }
    }
  }

  /**
   * Parse like event
   */
  private parseLike(body: Record<string, unknown> | undefined, user: string): ParsedTikTokEvent | null {
    if (!body) return null

    return {
      type: 'like',
      user,
      data: {
        count: (body.likeCount as number) || 1
      }
    }
  }
}

/**
 * Parsed TikTok event structure
 */
export interface ParsedTikTokEvent {
  type: string
  user: string
  data: Record<string, unknown>
}
