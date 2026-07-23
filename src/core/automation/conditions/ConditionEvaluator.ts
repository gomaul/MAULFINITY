import { MaulfinityEvent } from '@core/event-bus/types'
import { AutomationCondition, CooldownStore } from '../types'
import { Logger } from '@services/logger'

const logger = new Logger('ConditionEvaluator')

export interface ConditionEvaluatorInterface {
  evaluate(condition: AutomationCondition, event: MaulfinityEvent, cooldowns?: CooldownStore): boolean
  evaluateAll(conditions: AutomationCondition[], event: MaulfinityEvent, cooldowns?: CooldownStore): boolean
}

/**
 * Evaluates automation conditions against events
 * 
 * Supported condition types:
 * - gift: Check gift name
 * - username: Check event user
 * - value: Check numeric value (count, amount, diamonds)
 * - event: Check event type
 * - random: Random chance evaluation
 * - cooldown: Check/set cooldown
 * - platform: Check platform source
 */
export class ConditionEvaluator implements ConditionEvaluatorInterface {
  /**
   * Evaluate a single condition against an event
   */
  evaluate(condition: AutomationCondition, event: MaulfinityEvent, cooldowns?: CooldownStore): boolean {
    try {
      switch (condition.type) {
        case 'gift':
          return this.evaluateGiftCondition(condition, event)
        
        case 'username':
          return this.evaluateUsernameCondition(condition, event)
        
        case 'value':
          return this.evaluateValueCondition(condition, event)
        
        case 'event':
          return this.evaluateEventCondition(condition, event)
        
        case 'random':
          return this.evaluateRandomCondition(condition)
        
        case 'cooldown':
          return this.evaluateCooldownCondition(condition, cooldowns)
        
        case 'platform':
          return this.evaluatePlatformCondition(condition, event)
        
        default:
          logger.warning(`Unknown condition type: ${condition.type}`)
          return false
      }
    } catch (error) {
      logger.error(`Error evaluating condition: ${condition.type}`, error as Error)
      return false
    }
  }

  /**
   * Evaluate all conditions (AND logic)
   */
  evaluateAll(conditions: AutomationCondition[], event: MaulfinityEvent, cooldowns?: CooldownStore): boolean {
    if (conditions.length === 0) {
      return true // No conditions = always match
    }

    return conditions.every(condition => this.evaluate(condition, event, cooldowns))
  }

  /**
   * Evaluate gift name condition
   * Checks if the gift name matches
   */
  private evaluateGiftCondition(condition: AutomationCondition, event: MaulfinityEvent): boolean {
    const payload = event.payload as Record<string, unknown>
    const giftName = payload?.name as string

    if (!giftName) {
      return false
    }

    const targetValue = condition.value as string
    const operator = condition.operator || '=='

    switch (operator) {
      case '==':
        return giftName.toLowerCase() === targetValue.toLowerCase()
      case '!=':
        return giftName.toLowerCase() !== targetValue.toLowerCase()
      case 'contains':
        return giftName.toLowerCase().includes(targetValue.toLowerCase())
      default:
        return giftName.toLowerCase() === targetValue.toLowerCase()
    }
  }

  /**
   * Evaluate username condition
   * Checks if the event user matches
   */
  private evaluateUsernameCondition(condition: AutomationCondition, event: MaulfinityEvent): boolean {
    const username = event.user
    const targetValue = condition.value as string
    const operator = condition.operator || '=='

    switch (operator) {
      case '==':
        return username.toLowerCase() === targetValue.toLowerCase()
      case '!=':
        return username.toLowerCase() !== targetValue.toLowerCase()
      case 'contains':
        return username.toLowerCase().includes(targetValue.toLowerCase())
      case 'matches':
        try {
          const regex = new RegExp(targetValue, 'i')
          return regex.test(username)
        } catch {
          logger.warning(`Invalid regex pattern: ${targetValue}`)
          return false
        }
      default:
        return username.toLowerCase() === targetValue.toLowerCase()
    }
  }

  /**
   * Evaluate numeric value condition
   * Checks count, amount, or diamonds against a threshold
   */
  private evaluateValueCondition(condition: AutomationCondition, event: MaulfinityEvent): boolean {
    const payload = event.payload as Record<string, unknown>
    
    // Try to get numeric value from various payload fields
    const numericValue = (payload?.count as number) 
      ?? (payload?.amount as number) 
      ?? (payload?.diamonds as number)
      ?? 0

    const targetValue = condition.value as number
    const operator = condition.operator || '>='

    switch (operator) {
      case '==':
        return numericValue === targetValue
      case '!=':
        return numericValue !== targetValue
      case '>':
        return numericValue > targetValue
      case '<':
        return numericValue < targetValue
      case '>=':
        return numericValue >= targetValue
      case '<=':
        return numericValue <= targetValue
      default:
        return numericValue >= targetValue
    }
  }

  /**
   * Evaluate event type condition
   * Checks if the event type matches
   */
  private evaluateEventCondition(condition: AutomationCondition, event: MaulfinityEvent): boolean {
    const targetValue = condition.value as string
    const operator = condition.operator || '=='

    switch (operator) {
      case '==':
        return event.type === targetValue
      case '!=':
        return event.type !== targetValue
      default:
        return event.type === targetValue
    }
  }

  /**
   * Evaluate random chance condition
   * Returns true based on probability
   */
  private evaluateRandomCondition(condition: AutomationCondition): boolean {
    const probability = condition.probability ?? (condition.value as number) ?? 50
    const random = Math.random() * 100
    return random < probability
  }

  /**
   * Evaluate cooldown condition
   * Returns true if NOT on cooldown (ready to execute)
   */
  private evaluateCooldownCondition(condition: AutomationCondition, cooldowns?: CooldownStore): boolean {
    if (!cooldowns) {
      return true
    }

    const cooldownKey = `cooldown_${condition.value}`
    const cooldownSeconds = condition.cooldownSeconds ?? 5

    if (cooldowns.isOnCooldown(cooldownKey)) {
      return false // On cooldown, don't execute
    }

    // Set cooldown for next time
    cooldowns.setCooldown(cooldownKey, cooldownSeconds)
    return true
  }

  /**
   * Evaluate platform condition
   * Checks if the event platform matches
   */
  private evaluatePlatformCondition(condition: AutomationCondition, event: MaulfinityEvent): boolean {
    const targetValue = condition.value as string
    const operator = condition.operator || '=='

    switch (operator) {
      case '==':
        return event.platform === targetValue
      case '!=':
        return event.platform !== targetValue
      default:
        return event.platform === targetValue
    }
  }
}
