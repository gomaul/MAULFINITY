import { BaseNode } from './BaseNode'
import { NodeCategory, NodePortDefinition, ConfigSchema, NodeOutput, ExecutionContext } from '../types'

/**
 * VariableNode - Base class for variable and counter management nodes
 *
 * Variable nodes manage persistent state across event executions.
 */
export abstract class VariableNode extends BaseNode {
  readonly category: NodeCategory = 'variable'
}

// ============================================================
// CONCRETE VARIABLE NODES
// ============================================================

/** SetVariable Node - Set a variable value */
export class SetVariableNode extends VariableNode {
  readonly type = 'variable:set'
  readonly name = 'Set Variable'
  readonly description = 'Set a variable to a value'
  readonly icon = '📝'
  readonly color = '#ec4899'

  getInputs(): NodePortDefinition[] {
    return [
      { name: 'input', type: 'signal', required: true, label: 'Input' }
    ]
  }

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'output', type: 'signal', required: false, label: 'Output' }
    ]
  }

  getConfigSchema(): ConfigSchema {
    return {
      name: { type: 'string', label: 'Variable Name', required: true, placeholder: 'myVar' },
      value: { type: 'string', label: 'Value', required: true, placeholder: '0' }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.name === 'string' && config.name.length > 0
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const name = this.getConfig<string>(config, 'name', '')
    const value = config.value

    context.variables.set(name, value)
    this.logger.debug(`Set variable "${name}" = ${JSON.stringify(value)}`)

    return this.success('output', { name, value })
  }
}

/** GetVariable Node - Get a variable value */
export class GetVariableNode extends VariableNode {
  readonly type = 'variable:get'
  readonly name = 'Get Variable'
  readonly description = 'Get the value of a variable'
  readonly icon = '📖'
  readonly color = '#ec4899'

  getInputs(): NodePortDefinition[] {
    return [
      { name: 'input', type: 'signal', required: true, label: 'Input' }
    ]
  }

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'output', type: 'signal', required: false, label: 'Output' },
      { name: 'value', type: 'data', required: false, label: 'Value' }
    ]
  }

  getConfigSchema(): ConfigSchema {
    return {
      name: { type: 'string', label: 'Variable Name', required: true, placeholder: 'myVar' }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.name === 'string' && config.name.length > 0
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const name = this.getConfig<string>(config, 'name', '')
    const value = context.variables.get(name)

    this.logger.debug(`Get variable "${name}" = ${JSON.stringify(value)}`)

    return this.success('output', { name, value })
  }
}

/** IncrementCounter Node - Increment a counter */
export class IncrementCounterNode extends VariableNode {
  readonly type = 'variable:increment'
  readonly name = 'Increment Counter'
  readonly description = 'Increment a counter by an amount'
  readonly icon = '➕'
  readonly color = '#ec4899'

  getInputs(): NodePortDefinition[] {
    return [
      { name: 'input', type: 'signal', required: true, label: 'Input' }
    ]
  }

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'output', type: 'signal', required: false, label: 'Output' },
      { name: 'newValue', type: 'data', required: false, label: 'New Value' }
    ]
  }

  getConfigSchema(): ConfigSchema {
    return {
      counter: { type: 'string', label: 'Counter Name', required: true, placeholder: 'rose_count' },
      amount: { type: 'number', label: 'Amount', default: 1, min: 1, step: 1 }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.counter === 'string' && config.counter.length > 0
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const counterName = this.getConfig<string>(config, 'counter', '')
    const amount = this.getConfig<number>(config, 'amount', 1)

    const newValue = context.counters.increment(counterName, amount)
    this.logger.debug(`Increment counter "${counterName}" by ${amount} = ${newValue}`)

    return this.success('output', { counterName, newValue })
  }
}

/** DecrementCounter Node - Decrement a counter */
export class DecrementCounterNode extends VariableNode {
  readonly type = 'variable:decrement'
  readonly name = 'Decrement Counter'
  readonly description = 'Decrement a counter by an amount'
  readonly icon = '➖'
  readonly color = '#ec4899'

  getInputs(): NodePortDefinition[] {
    return [
      { name: 'input', type: 'signal', required: true, label: 'Input' }
    ]
  }

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'output', type: 'signal', required: false, label: 'Output' },
      { name: 'newValue', type: 'data', required: false, label: 'New Value' }
    ]
  }

  getConfigSchema(): ConfigSchema {
    return {
      counter: { type: 'string', label: 'Counter Name', required: true, placeholder: 'rose_count' },
      amount: { type: 'number', label: 'Amount', default: 1, min: 1, step: 1 }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.counter === 'string' && config.counter.length > 0
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const counterName = this.getConfig<string>(config, 'counter', '')
    const amount = this.getConfig<number>(config, 'amount', 1)

    const newValue = context.counters.decrement(counterName, amount)
    this.logger.debug(`Decrement counter "${counterName}" by ${amount} = ${newValue}`)

    return this.success('output', { counterName, newValue })
  }
}

/** ResetCounter Node - Reset a counter to 0 */
export class ResetCounterNode extends VariableNode {
  readonly type = 'variable:reset'
  readonly name = 'Reset Counter'
  readonly description = 'Reset a counter to zero'
  readonly icon = '🔄'
  readonly color = '#ec4899'

  getInputs(): NodePortDefinition[] {
    return [
      { name: 'input', type: 'signal', required: true, label: 'Input' }
    ]
  }

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'output', type: 'signal', required: false, label: 'Output' }
    ]
  }

  getConfigSchema(): ConfigSchema {
    return {
      counter: { type: 'string', label: 'Counter Name', required: true, placeholder: 'rose_count' }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.counter === 'string' && config.counter.length > 0
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const counterName = this.getConfig<string>(config, 'counter', '')

    context.counters.reset(counterName)
    this.logger.debug(`Reset counter "${counterName}" to 0`)

    return this.success('output', { counterName, newValue: 0 })
  }
}

/** CompareVariable Node - Compare variable against a value */
export class CompareVariableNode extends VariableNode {
  readonly type = 'variable:compare'
  readonly name = 'Compare Variable'
  readonly description = 'Compare a variable against a value'
  readonly icon = '⚖️'
  readonly color = '#ec4899'

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

  getConfigSchema(): ConfigSchema {
    return {
      name: { type: 'string', label: 'Variable Name', required: true, placeholder: 'myVar' },
      operator: {
        type: 'select',
        label: 'Operator',
        default: '==',
        options: [
          { label: '==', value: '==' },
          { label: '!=', value: '!=' },
          { label: '>', value: '>' },
          { label: '>=', value: '>=' },
          { label: '<', value: '<' },
          { label: '<=', value: '<=' }
        ]
      },
      value: { type: 'string', label: 'Compare Value', required: true, placeholder: '0' }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.name === 'string' && config.name.length > 0
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const name = this.getConfig<string>(config, 'name', '')
    const operator = this.getConfig<string>(config, 'operator', '==')
    const compareValue = config.value

    const currentValue = context.variables.get(name)
    let result = false

    const current = Number(currentValue) || 0
    const target = Number(compareValue) || 0

    switch (operator) {
      case '==': result = current === target; break
      case '!=': result = current !== target; break
      case '>': result = current > target; break
      case '>=': result = current >= target; break
      case '<': result = current < target; break
      case '<=': result = current <= target; break
    }

    this.logger.debug(`Compare "${name}" ${operator} ${compareValue}: ${result}`)

    return this.success(result ? 'true' : 'false', { result, currentValue })
  }
}
