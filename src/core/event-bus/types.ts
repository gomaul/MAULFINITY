export { MaulfinityEvent } from '@shared/types'

export interface TikTokGiftEvent extends MaulfinityEvent {
  type: 'gift'
  payload: {
    name: string
    count: number
    diamonds: number
  }
}

export interface TikTokCommentEvent extends MaulfinityEvent {
  type: 'comment'
  payload: {
    text: string
  }
}

export interface TikTokFollowEvent extends MaulfinityEvent {
  type: 'follow'
  payload: Record<string, never>
}

export interface YouTubeSuperChatEvent extends MaulfinityEvent {
  type: 'superchat'
  payload: {
    amount: number
    currency: string
    message: string
  }
}
