import { v4 as uuidv4 } from 'uuid'
import { MaulfinityEvent } from '@core/event-bus/types'
import { Logger } from '@services/logger'

const logger = new Logger('EventAdapter')

/**
 * Raw platform event before normalization
 */
export interface PlatformEvent {
  platform: string
  type: string
  user?: string
  data: Record<string, unknown>
}

/**
 * EventAdapter - Normalizes all platform events into MaulfinityEvent format
 *
 * This is the critical module that ensures Trigger Engine only sees
 * one event format, regardless of the source platform.
 *
 * Flow:
 *   Platform Event (raw) → EventAdapter.normalize() → MaulfinityEvent → EventBus
 *
 * Usage:
 *   const adapter = new EventAdapter()
 *   const normalized = adapter.normalize({
 *     platform: 'tiktok',
 *     type: 'gift',
 *     user: 'alex',
 *     data: { gift_name: 'Rose', repeat_count: 1 }
 *   })
 */
export class EventAdapter {
  private logger: Logger

  constructor() {
    this.logger = new Logger('EventAdapter')
  }

  /**
   * Normalize a platform event into MaulfinityEvent format
   */
  normalize(event: PlatformEvent): MaulfinityEvent {
    const normalized: MaulfinityEvent = {
      id: uuidv4(),
      type: this.normalizeEventType(event.type),
      platform: event.platform.toLowerCase(),
      user: event.user || 'unknown',
      payload: this.normalizePayload(event),
      timestamp: Date.now()
    }

    this.logger.debug(
      `[${normalized.platform}] Normalized event: ${normalized.type} from ${normalized.user}`
    )

    return normalized
  }

  /**
   * Normalize multiple platform events at once
   */
  normalizeMany(events: PlatformEvent[]): MaulfinityEvent[] {
    return events.map(event => this.normalize(event))
  }

  /**
   * Normalize event type to standard format
   */
  private normalizeEventType(type: string): string {
    const typeMap: Record<string, string> = {
      // TikTok events
      'gift_name': 'gift',
      'gift': 'gift',
      'chat': 'comment',
      'comment': 'comment',
      'follow': 'follow',
      'like': 'like',
      'share': 'share',
      'join': 'join',
      'roomUser': 'join',
      'social': 'share',

      // YouTube events
      'superchat': 'superchat',
      'superChat': 'superchat',
      'super_chat': 'superchat',
      'membership': 'membership',
      'membershipItem': 'membership',
      'membership_item': 'membership',
      'liveChat': 'comment',
      'live_chat': 'comment',

      // Generic
      'subscribe': 'subscribe',
      'donation': 'donation'
    }

    return typeMap[type.toLowerCase()] || type.toLowerCase()
  }

  /**
   * Normalize payload based on platform and event type
   */
  private normalizePayload(event: PlatformEvent): Record<string, unknown> {
    switch (event.platform.toLowerCase()) {
      case 'tiktok':
        return this.normalizeTikTokPayload(event)
      case 'youtube':
        return this.normalizeYouTubePayload(event)
      default:
        return event.data || {}
    }
  }

  /**
   * Normalize TikTok-specific payload
   */
  private normalizeTikTokPayload(event: PlatformEvent): Record<string, unknown> {
    const data = event.data

    switch (event.type.toLowerCase()) {
      case 'gift':
        return {
          name: data.giftName || data.gift_name || data.name || 'unknown',
          count: data.repeatCount || data.repeat_count || data.count || 1,
          diamonds: data.diamondCount || data.diamond_count || data.diamonds || 0,
          combo: data.combo || false
        }
      case 'comment':
      case 'chat':
        return {
          text: data.comment || data.text || data.message || ''
        }
      case 'follow':
        return {}
      case 'like':
        return {
          count: data.likeCount || data.like_count || data.count || 1
        }
      case 'share':
        return {}
      case 'join':
        return {
          viewerCount: data.viewerCount || data.viewer_count || 0
        }
      default:
        return data || {}
    }
  }

  /**
   * Normalize YouTube-specific payload
   */
  private normalizeYouTubePayload(event: PlatformEvent): Record<string, unknown> {
    const data = event.data

    switch (event.type.toLowerCase()) {
      case 'superchat':
      case 'super_chat':
      case 'superchatmessage':
        return {
          amount: data.amount || data.superchatAmount || 0,
          currency: data.currency || data.superchatCurrency || 'USD',
          message: data.message || data.superchatMessage || '',
          tier: data.tier || data.superchatTier || 0
        }
      case 'membership':
      case 'membershipitem':
      case 'membership_item':
        return {
          tier: data.tier || data.membershipLevel || '',
          months: data.cumulativeMonths || data.months || 1
        }
      case 'livechat':
      case 'live_chat':
      case 'comment':
        return {
          text: data.message || data.text || ''
        }
      case 'like':
        return {}
      default:
        return data || {}
    }
  }

  /**
   * Validate that an event has required fields
   */
  validate(event: MaulfinityEvent): boolean {
    if (!event.id || !event.type || !event.platform) {
      this.logger.warning('Invalid event: missing required fields')
      return false
    }
    if (typeof event.timestamp !== 'number') {
      this.logger.warning('Invalid event: missing or invalid timestamp')
      return false
    }
    return true
  }
}
