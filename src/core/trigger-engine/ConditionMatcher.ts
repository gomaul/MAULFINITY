import { MaulfinityEvent } from '../event-bus/types'
import { TriggerCondition } from './types'

export class ConditionMatcher {
  /**
   * Check if an event matches the given conditions
   */
  match(condition: TriggerCondition, event: MaulfinityEvent): boolean {
    // If no conditions, always match
    if (!condition || Object.keys(condition).length === 0) {
      return true
    }

    // Check gift name condition
    if (condition.gift) {
      const giftName = (event.payload as Record<string, unknown>)?.name
      if (giftName !== condition.gift) return false
    }

    // Check value condition
    if (condition.value !== undefined) {
      const eventValue = (event.payload as Record<string, unknown>)?.count ||
                         (event.payload as Record<string, unknown>)?.amount || 0
      if ((eventValue as number) < condition.value) return false
    }

    // Check username condition
    if (condition.username) {
      if (event.user !== condition.username) return false
    }

    // Check keyword condition
    if (condition.keyword) {
      const text = (event.payload as Record<string, unknown>)?.text as string
      if (!text || !text.includes(condition.keyword)) return false
    }

    // Check platform condition
    if (condition.platform) {
      if (event.platform !== condition.platform) return false
    }

    return true
  }
}
