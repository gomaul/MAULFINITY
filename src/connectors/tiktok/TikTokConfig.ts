/**
 * TikTok-specific configuration
 */
export interface TikTokConfig {
  platform: 'tiktok'
  username: string
  roomId?: string
  autoReconnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  heartbeatInterval?: number
}

/**
 * Default TikTok configuration
 */
export const DEFAULT_TIKTOK_CONFIG: Partial<TikTokConfig> = {
  platform: 'tiktok',
  autoReconnect: true,
  reconnectAttempts: 3,
  reconnectDelay: 5000,
  heartbeatInterval: 30000
}

/**
 * TikTok event data shapes (raw from platform)
 */
export interface TikTokRawGift {
  giftName: string
  repeatCount: number
  diamondCount: number
  combo?: boolean
}

export interface TikTokRawComment {
  comment: string
}

export interface TikTokRawFollow {
  userId?: string
}

export interface TikTokRawLike {
  likeCount?: number
}

export interface TikTokRawJoin {
  viewerCount?: number
}
