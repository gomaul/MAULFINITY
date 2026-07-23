export interface TriggerCondition {
  gift?: string
  value?: number
  username?: string
  keyword?: string
  platform?: string
}

export interface TriggerAction {
  type: string
  config: Record<string, unknown>
}

export interface Trigger {
  id: string
  profileId: string
  name: string
  eventType: string
  condition: TriggerCondition
  actions: TriggerAction[]
  enabled: boolean
  createdAt: string
}
