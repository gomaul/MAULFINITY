import { BaseNode } from './BaseNode'
import { NodeCategory, NodePortDefinition, ConfigSchema, NodeOutput, ExecutionContext } from '../types'

/**
 * LogicNode - Base class for logic combination nodes
 *
 * Logic nodes combine multiple boolean inputs or route signals
 * based on logical conditions.
 */
export abstract class LogicNode extends BaseNode {
  readonly category: NodeCategory = 'logic'
}

// ============================================================
// CONCRETE LOGIC NODES
// ============================================================

/** AND Node - All inputs must be true */
export class AndNode extends LogicNode {
  readonly type = 'logic:and'
  readonly name = 'AND'
  readonly description = 'True only if ALL inputs are true'
  readonly icon = '&'
  readonly color = '#8b5cf6'

  getInputs(): NodePortDefinition[] {
    return [
      { name: 'in1', type: 'signal', required: true, label: 'Input 1' },
      { name: 'in2', type: 'signal', required: true, label: 'Input 2' }
    ]
  }

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'true', type: 'signal', required: false, label: 'True' },
      { name: 'false', type: 'signal', required: false, label: 'False' }
    ]
  }

  getConfigSchema(): ConfigSchema {
    return {}
  }

  validate(): boolean {
    return true
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    // In execution, we check if all connected inputs received true signals
    // For now, this is a placeholder that routes based on config
    const result = this.getConfig<boolean>(config, 'result', true)
    return this.success(result ? 'true' : 'false', { result })
  }
}

/** OR Node - Any input being true makes it true */
export class OrNode extends LogicNode {
  readonly type = 'logic:or'
  readonly name = 'OR'
  readonly description = 'True if ANY input is true'
  readonly icon = '|'
  readonly color = '#8b5cf6'

  getInputs(): NodePortDefinition[] {
    return [
      { name: 'in1', type: 'signal', required: true, label: 'Input 1' },
      { name: 'in2', type: 'signal', required: true, label: 'Input 2' }
    ]
  }

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'true', type: 'signal', required: false, label: 'True' },
      { name: 'false', type: 'signal', required: false, label: 'False' }
    ]
  }

  getConfigSchema(): ConfigSchema {
    return {}
  }

  validate(): boolean {
    return true
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const result = this.getConfig<boolean>(config, 'result', true)
    return this.success(result ? 'true' : 'false', { result })
  }
}

/** NOT Node - Inverts the input signal */
export class NotNode extends LogicNode {
  readonly type = 'logic:not'
  readonly name = 'NOT'
  readonly description = 'Inverts the input signal'
  readonly icon = '!'
  readonly color = '#8b5cf6'

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
    return {}
  }

  validate(): boolean {
    return true
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const input = this.getConfig<boolean>(config, 'input', false)
    const result = !input
    return this.success(result ? 'true' : 'false', { result })
  }
}

/** Branch Node - Classic if/else routing */
export class BranchNode extends LogicNode {
  readonly type = 'logic:branch'
  readonly name = 'Branch'
  readonly description = 'Route to true or false branch based on condition'
  readonly icon = '⑂'
  readonly color = '#8b5cf6'

  getInputs(): NodePortDefinition[] {
    return [
      { name: 'condition', type: 'signal', required: true, label: 'Condition' }
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
      condition: {
        type: 'select',
        label: 'Route Based On',
        required: true,
        default: 'previous',
        options: [
          { label: 'Previous Node Result', value: 'previous' },
          { label: 'Always True', value: 'true' },
          { label: 'Always False', value: 'false' }
        ]
      }
    }
  }

  validate(): boolean {
    return true
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const condition = this.getConfig<string>(config, 'condition', 'previous')
    let result = true

    if (condition === 'true') result = true
    else if (condition === 'false') result = false

    return this.success(result ? 'true' : 'false', { result })
  }
}

/** Switch Node - Multi-branch routing based on value */
export class SwitchNode extends LogicNode {
  readonly type = 'logic:switch'
  readonly name = 'Switch'
  readonly description = 'Route to different outputs based on a value'
  readonly icon = '⊞'
  readonly color = '#8b5cf6'

  getInputs(): NodePortDefinition[] {
    return [
      { name: 'input', type: 'data', required: true, label: 'Value' }
    ]
  }

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'case1', type: 'signal', required: false, label: 'Case 1' },
      { name: 'case2', type: 'signal', required: false, label: 'Case 2' },
      { name: 'case3', type: 'signal', required: false, label: 'Case 3' },
      { name: 'default', type: 'signal', required: false, label: 'Default' }
    ]
  }

  getConfigSchema(): ConfigSchema {
    return {
      case1Value: { type: 'string', label: 'Case 1 Value', placeholder: 'value1' },
      case2Value: { type: 'string', label: 'Case 2 Value', placeholder: 'value2' },
      case3Value: { type: 'string', label: 'Case 3 Value', placeholder: 'value3' }
    }
  }

  validate(): boolean {
    return true
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const value = this.getConfig<string>(config, 'value', '')
    const case1 = this.getConfig<string>(config, 'case1Value', '')
    const case2 = this.getConfig<string>(config, 'case2Value', '')
    const case3 = this.getConfig<string>(config, 'case3Value', '')

    if (value === case1 && case1) return this.success('case1', { value })
    if (value === case2 && case2) return this.success('case2', { value })
    if (value === case3 && case3) return this.success('case3', { value })
    return this.success('default', { value })
  }
}

/** Gate Node - Pass signal only if enabled */
export class GateNode extends LogicNode {
  readonly type = 'logic:gate'
  readonly name = 'Gate'
  readonly description = 'Pass signal only if gate is enabled'
  readonly icon = '🚧'
  readonly color = '#8b5cf6'

  getInputs(): NodePortDefinition[] {
    return [
      { name: 'input', type: 'signal', required: true, label: 'Input' },
      { name: 'enable', type: 'data', required: false, label: 'Enable' }
    ]
  }

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'output', type: 'signal', required: false, label: 'Output' }
    ]
  }

  getConfigSchema(): ConfigSchema {
    return {
      enabled: { type: 'boolean', label: 'Gate Enabled', default: true }
    }
  }

  validate(): boolean {
    return true
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const enabled = this.getConfig<boolean>(config, 'enabled', true)
    if (!enabled) return this.noop()
    return this.success('output', { passed: true })
  }
}
