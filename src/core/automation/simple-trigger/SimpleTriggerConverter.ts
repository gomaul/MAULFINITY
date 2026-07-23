import { AutomationConfig, AutomationCondition, AutomationAction } from '../types'
import { Trigger } from '@core/trigger-engine/types'
import { Logger } from '@services/logger'

const logger = new Logger('SimpleTriggerConverter')

/**
 * SimpleTriggerConverter provides backward compatibility
 * by converting legacy Trigger format to AutomationConfig
 * 
 * This allows existing triggers to work with the new Automation Engine
 * while maintaining the same behavior.
 */
export class SimpleTriggerConverter {
  /**
   * Convert a legacy Trigger to AutomationConfig
   */
  static convert(trigger: Trigger): AutomationConfig {
    logger.info(`Converting trigger: ${trigger.name}`)

    // Convert event type
    const eventType = trigger.eventType

    // Convert conditions
    const conditions = SimpleTriggerConverter.convertConditions(trigger)

    // Convert actions
    const actions = SimpleTriggerConverter.convertActions(trigger)

    const automation: AutomationConfig = {
      id: `converted_${trigger.id}`,
      profileId: trigger.profileId,
      name: trigger.name,
      description: `Converted from trigger: ${trigger.name}`,
      type: 'simple',
      enabled: trigger.enabled,
      eventType,
      conditions,
      actions,
      createdAt: trigger.createdAt,
      updatedAt: new Date().toISOString()
    }

    logger.info(`Converted trigger "${trigger.name}" to automation`)
    return automation
  }

  /**
   * Convert trigger conditions to automation conditions
   */
  private static convertConditions(trigger: Trigger): AutomationCondition[] {
    const conditions: AutomationCondition[] = []
    const cond = trigger.condition

    if (!cond) return conditions

    // Gift name condition
    if (cond.gift) {
      conditions.push({
        type: 'gift',
        operator: '==',
        value: cond.gift
      })
    }

    // Value condition
    if (cond.value !== undefined && cond.value !== null) {
      conditions.push({
        type: 'value',
        operator: '>=',
        value: cond.value
      })
    }

    // Username condition
    if (cond.username) {
      conditions.push({
        type: 'username',
        operator: '==',
        value: cond.username
      })
    }

    // Keyword condition (for comments)
    if (cond.keyword) {
      // Keywords are typically checked in the event payload
      // We'll store it as a special condition
      conditions.push({
        type: 'event',
        operator: 'contains',
        value: cond.keyword
      })
    }

    // Platform condition
    if (cond.platform) {
      conditions.push({
        type: 'platform',
        operator: '==',
        value: cond.platform
      })
    }

    return conditions
  }

  /**
   * Convert trigger actions to automation actions
   */
  private static convertActions(trigger: Trigger): AutomationAction[] {
    const actions: AutomationAction[] = []

    if (!trigger.actions || !Array.isArray(trigger.actions)) {
      return actions
    }

    trigger.actions.forEach((action, index) => {
      actions.push({
        type: action.type,
        config: action.config || {},
        order: index
      })
    })

    return actions
  }

  /**
   * Convert multiple triggers to automations
   */
  static convertMany(triggers: Trigger[]): AutomationConfig[] {
    return triggers.map(trigger => SimpleTriggerConverter.convert(trigger))
  }

  /**
   * Convert automation config back to trigger format (for backward compatibility)
   */
  static convertToTrigger(automation: AutomationConfig): Trigger {
    const condition: Record<string, unknown> = {}

    // Extract conditions
    for (const cond of automation.conditions) {
      switch (cond.type) {
        case 'gift':
          condition.gift = cond.value
          break
        case 'value':
          condition.value = cond.value
          break
        case 'username':
          condition.username = cond.value
          break
        case 'platform':
          condition.platform = cond.value
          break
      }
    }

    const trigger: Trigger = {
      id: automation.id.replace('converted_', ''),
      profileId: automation.profileId,
      name: automation.name,
      eventType: automation.eventType,
      condition,
      actions: automation.actions.map(a => ({
        type: a.type,
        config: a.config
      })),
      enabled: automation.enabled,
      createdAt: automation.createdAt
    }

    return trigger
  }
}
