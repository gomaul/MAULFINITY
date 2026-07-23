import { BaseNode } from './BaseNode'
import { NodeCategory, NodePortDefinition, ConfigSchema, NodeOutput, ExecutionContext } from '../types'

/**
 * ConditionNode - Base class for condition evaluation nodes
 *
 * Condition nodes evaluate a boolean condition and route execution
 * to either the 'true' or 'false' output branch.
 */
export abstract class ConditionNode extends BaseNode {
  readonly category: NodeCategory = 'condition'

  getInputs(): NodePortDefinition[] {
    return [
      { name: 'input', type: 'signal', required: true, label: 'Input' }
    ]
  }

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'true', type: 'signal', required: false, label: 'True' },
      { name: 'false', type: 'signal', required: false, label: 'False' }
    ]
  }

  async execute(
    config: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<NodeOutput> {
    const result = this.evaluate(config, context)
    const signal = result ? 'true' : 'false'

    this.logger.debug(`Condition ${this.type}: ${result ? 'TRUE' : 'FALSE'}`)

    return this.success(signal, {
      result,
      event: context.triggerEvent
    })
  }

  /**
   * Evaluate the condition - subclasses must implement
   */
  protected abstract evaluate(
    config: Record<string, unknown>,
    context: ExecutionContext
  ): boolean
}

// ============================================================
// CONCRETE CONDITION NODES
// ============================================================

/** GiftName Condition - Check if gift name matches */
export class GiftNameConditionNode extends ConditionNode {
  readonly type = 'condition:giftname'
  readonly name = 'Gift Name'
  readonly description = 'Check if the gift name matches'
  readonly icon = '🎁'
  readonly color = '#f59e0b'

  getConfigSchema(): ConfigSchema {
    return {
      name: { type: 'string', label: 'Gift Name', required: true, placeholder: 'e.g., Lion' },
      operator: {
        type: 'select',
        label: 'Operator',
        default: '==',
        options: [
          { label: 'Equals', value: '==' },
          { label: 'Not Equals', value: '!=' },
          { label: 'Contains', value: 'contains' }
        ]
      }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.name === 'string' && config.name.length > 0
  }

  protected evaluate(config: Record<string, unknown>, context: ExecutionContext): boolean {
    const payload = context.triggerEvent.payload as Record<string, unknown>
    const giftName = (payload.name as string) || ''
    const targetName = this.getConfig<string>(config, 'name', '')
    const operator = this.getConfig<string>(config, 'operator', '==')

    switch (operator) {
      case '==': return giftName.toLowerCase() === targetName.toLowerCase()
      case '!=': return giftName.toLowerCase() !== targetName.toLowerCase()
      case 'contains': return giftName.toLowerCase().includes(targetName.toLowerCase())
      default: return giftName.toLowerCase() === targetName.toLowerCase()
    }
  }
}

/** CoinValue Condition - Check numeric value */
export class CoinValueConditionNode extends ConditionNode {
  readonly type = 'condition:coinvalue'
  readonly name = 'Coin Value'
  readonly description = 'Check the numeric value (count, amount, diamonds)'
  readonly icon = '🪙'
  readonly color = '#f59e0b'

  getConfigSchema(): ConfigSchema {
    return {
      operator: {
        type: 'select',
        label: 'Operator',
        default: '>=',
        options: [
          { label: '>=', value: '>=' },
          { label: '>', value: '>' },
          { label: '==', value: '==' },
          { label: '!=', value: '!=' },
          { label: '<', value: '<' },
          { label: '<=', value: '<=' }
        ]
      },
      value: { type: 'number', label: 'Value', required: true, default: 1, min: 0 }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.value === 'number'
  }

  protected evaluate(config: Record<string, unknown>, context: ExecutionContext): boolean {
    const payload = context.triggerEvent.payload as Record<string, unknown>
    const numericValue = (payload.count as number)
      ?? (payload.amount as number)
      ?? (payload.diamonds as number)
      ?? 0

    const targetValue = this.getConfig<number>(config, 'value', 1)
    const operator = this.getConfig<string>(config, 'operator', '>=')

    switch (operator) {
      case '>=': return numericValue >= targetValue
      case '>': return numericValue > targetValue
      case '==': return numericValue === targetValue
      case '!=': return numericValue !== targetValue
      case '<': return numericValue < targetValue
      case '<=': return numericValue <= targetValue
      default: return numericValue >= targetValue
    }
  }
}

/** Username Condition - Check event user */
export class UsernameConditionNode extends ConditionNode {
  readonly type = 'condition:username'
  readonly name = 'Username'
  readonly description = 'Check if the event username matches'
  readonly icon = '👤'
  readonly color = '#f59e0b'

  getConfigSchema(): ConfigSchema {
    return {
      username: { type: 'string', label: 'Username', required: true, placeholder: 'e.g., gomaul' },
      operator: {
        type: 'select',
        label: 'Operator',
        default: '==',
        options: [
          { label: 'Equals', value: '==' },
          { label: 'Not Equals', value: '!=' },
          { label: 'Contains', value: 'contains' }
        ]
      }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.username === 'string' && config.username.length > 0
  }

  protected evaluate(config: Record<string, unknown>, context: ExecutionContext): boolean {
    const username = context.triggerEvent.user
    const targetUsername = this.getConfig<string>(config, 'username', '')
    const operator = this.getConfig<string>(config, 'operator', '==')

    switch (operator) {
      case '==': return username.toLowerCase() === targetUsername.toLowerCase()
      case '!=': return username.toLowerCase() !== targetUsername.toLowerCase()
      case 'contains': return username.toLowerCase().includes(targetUsername.toLowerCase())
      default: return username.toLowerCase() === targetUsername.toLowerCase()
    }
  }
}

/** Random Condition - Random probability branch */
export class RandomConditionNode extends ConditionNode {
  readonly type = 'condition:random'
  readonly name = 'Random'
  readonly description = 'Random chance branch (0-100%)'
  readonly icon = '🎲'
  readonly color = '#f59e0b'

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'true', type: 'signal', required: false, label: 'True (hit)' },
      { name: 'false', type: 'signal', required: false, label: 'False (miss)' }
    ]
  }

  getConfigSchema(): ConfigSchema {
    return {
      probability: { type: 'number', label: 'Probability (%)', required: true, default: 50, min: 0, max: 100, step: 1 }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    const prob = config.probability as number
    return typeof prob === 'number' && prob >= 0 && prob <= 100
  }

  protected evaluate(config: Record<string, unknown>, _context: ExecutionContext): boolean {
    const probability = this.getConfig<number>(config, 'probability', 50)
    const random = Math.random() * 100
    return random < probability
  }
}

/** Platform Condition - Check event platform */
export class PlatformConditionNode extends ConditionNode {
  readonly type = 'condition:platform'
  readonly name = 'Platform'
  readonly description = 'Check the event platform source'
  readonly icon = '📡'
  readonly color = '#f59e0b'

  getConfigSchema(): ConfigSchema {
    return {
      platform: {
        type: 'select',
        label: 'Platform',
        required: true,
        default: 'tiktok',
        options: [
          { label: 'TikTok', value: 'tiktok' },
          { label: 'YouTube', value: 'youtube' },
          { label: 'Any', value: '*' }
        ]
      }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.platform === 'string'
  }

  protected evaluate(config: Record<string, unknown>, context: ExecutionContext): boolean {
    const platform = context.triggerEvent.platform
    const targetPlatform = this.getConfig<string>(config, 'platform', '*')

    if (targetPlatform === '*') return true
    return platform.toLowerCase() === targetPlatform.toLowerCase()
  }
}
