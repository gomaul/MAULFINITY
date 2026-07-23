/**
 * YouTube-specific configuration
 */
export interface YouTubeConfig {
  platform: 'youtube'
  channelId?: string
  streamId?: string
  apiKey?: string
  autoReconnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  heartbeatInterval?: number
}

/**
 * Default YouTube configuration
 */
export const DEFAULT_YOUTUBE_CONFIG: Partial<YouTubeConfig> = {
  platform: 'youtube',
  autoReconnect: true,
  reconnectAttempts: 3,
  reconnectDelay: 5000,
  heartbeatInterval: 30000
}

/**
 * YouTube Live Chat message types
 */
export enum YouTubeMessageType {
  TEXT_MESSAGE = 'textMessageEvent',
  SUPER_CHAT = 'superChatEvent',
  SUPER_STICKER = 'superStickerEvent',
  MEMBERSHIP = 'membershipGiftingEvent',
  NEW_MEMBER = 'newSponsorshipEvent',
  TOMBSTONE = 'tombstone'
}

/**
 * YouTube Live Chat event data shapes
 */
export interface YouTubeLiveChatMessage {
  id: string
  snippet: {
    type: string
    publishedAt: string
    textMessageDetails?: {
      messageText: string
    }
    superChatDetails?: {
      amountDisplayString: string
      amountMicros: string
      currency: string
      tier: number
      userComment: string
    }
  }
  authorDetails: {
    channelId: string
    displayName: string
    profileImageUrl: string
    isChatSponsor: boolean
    isChatOwner: boolean
    isChatModerator: boolean
  }
}
