import { Logger } from '@services/logger'

const logger = new Logger('YouTubeParser')

/**
 * YouTubeParser - Parses YouTube Live Chat messages
 *
 * Handles YouTube Live Chat API response format and extracts
 * meaningful events (super chats, membership, comments, etc.)
 *
 * Usage:
 *   const parser = new YouTubeParser()
 *   const events = parser.parse(rawData)
 */
export class YouTubeParser {
  private logger: Logger

  constructor() {
    this.logger = new Logger('YouTubeParser')
  }

  /**
   * Parse raw YouTube Live Chat data into structured events
   */
  parse(data: unknown): ParsedYouTubeEvent[] {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data)
      }

      const messages = this.extractMessages(data)
      const events: ParsedYouTubeEvent[] = []

      for (const msg of messages) {
        const event = this.parseMessage(msg)
        if (event) {
          events.push(event)
        }
      }

      return events
    } catch (error) {
      this.logger.error('Failed to parse YouTube data', error as Error)
      return []
    }
  }

  /**
   * Extract messages from YouTube response
   */
  private extractMessages(data: unknown): unknown[] {
    if (!data || typeof data !== 'object') return []

    const obj = data as Record<string, unknown>

    // YouTube Live Chat API response format
    if (Array.isArray(obj.items)) {
      return obj.items
    }

    // Single message
    if (obj.id && obj.snippet) {
      return [data]
    }

    // Wrapped response
    if (obj.data && typeof obj.data === 'object') {
      const nested = obj.data as Record<string, unknown>
      if (Array.isArray(nested.items)) {
        return nested.items
      }
    }

    return []
  }

  /**
   * Parse a single YouTube message
   */
  private parseMessage(msg: unknown): ParsedYouTubeEvent | null {
    if (!msg || typeof msg !== 'object') return null

    const message = msg as Record<string, unknown>
    const snippet = message.snippet as Record<string, unknown> | undefined
    const authorDetails = message.authorDetails as Record<string, unknown> | undefined

    if (!snippet || !authorDetails) return null

    const type = snippet.type as string
    const user = (authorDetails.displayName as string) || 'unknown'

    switch (type) {
      case 'textMessageEvent':
        return this.parseTextMessage(snippet, user)

      case 'superChatEvent':
        return this.parseSuperChat(snippet, user)

      case 'superStickerEvent':
        return this.parseSuperSticker(snippet, user)

      case 'newSponsorshipEvent':
        return this.parseNewMember(snippet, user)

      case 'membershipGiftingEvent':
        return this.parseMembershipGift(snippet, user)

      default:
        this.logger.debug(`Unknown YouTube message type: ${type}`)
        return null
    }
  }

  /**
   * Parse text message (live chat comment)
   */
  private parseTextMessage(snippet: Record<string, unknown>, user: string): ParsedYouTubeEvent | null {
    const details = snippet.textMessageDetails as Record<string, unknown> | undefined
    if (!details) return null

    return {
      type: 'comment',
      user,
      data: {
        text: (details.messageText as string) || ''
      }
    }
  }

  /**
   * Parse super chat event
   */
  private parseSuperChat(snippet: Record<string, unknown>, user: string): ParsedYouTubeEvent | null {
    const details = snippet.superChatDetails as Record<string, unknown> | undefined
    if (!details) return null

    const amountMicros = Number(details.amountMicros) || 0
    const amount = amountMicros / 1_000_000

    return {
      type: 'superchat',
      user,
      data: {
        amount,
        currency: (details.currency as string) || 'USD',
        message: (details.userComment as string) || '',
        tier: (details.tier as number) || 0,
        displayString: (details.amountDisplayString as string) || `$${amount}`
      }
    }
  }

  /**
   * Parse super sticker event
   */
  private parseSuperSticker(snippet: Record<string, unknown>, user: string): ParsedYouTubeEvent | null {
    const details = snippet.superStickerDetails as Record<string, unknown> | undefined
    if (!details) return null

    const amountMicros = Number(details.amountMicros) || 0
    const amount = amountMicros / 1_000_000

    return {
      type: 'superchat',
      user,
      data: {
        amount,
        currency: (details.currency as string) || 'USD',
        message: '',
        tier: (details.tier as number) || 0,
        stickerUrl: (details.stickerUrl as string) || '',
        isSticker: true
      }
    }
  }

  /**
   * Parse new membership event
   */
  private parseNewMember(snippet: Record<string, unknown>, user: string): ParsedYouTubeEvent | null {
    return {
      type: 'membership',
      user,
      data: {
        tier: (snippet.membershipLevelName as string) || 'Member',
        isNew: true
      }
    }
  }

  /**
   * Parse membership gift event
   */
  private parseMembershipGift(snippet: Record<string, unknown>, user: string): ParsedYouTubeEvent | null {
    return {
      type: 'membership',
      user,
      data: {
        tier: (snippet.giftMembershipsGiftedCount as number) || 1,
        isGift: true
      }
    }
  }
}

/**
 * Parsed YouTube event structure
 */
export interface ParsedYouTubeEvent {
  type: string
  user: string
  data: Record<string, unknown>
}
