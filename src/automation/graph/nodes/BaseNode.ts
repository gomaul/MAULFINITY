import { Logger } from '@services/logger'
import {
  NodeCategory,
  NodeType,
  NodePortDefinition,
  ConfigSchema,
  NodeOutput,
  ExecutionContext
} from '../types'

/**
 * BaseNode - Abstract base class for all graph nodes
 *
 * Every node type must extend this class and implement:
 * - execute(): Run the node logic
 * - validate(): Validate node configuration
 * - getInputs(): Return input port definitions
 * - getOutputs(): Return output port definitions
 * - getConfigSchema(): Return configuration schema
 */
export abstract class BaseNode {
  /** Node type identifier (e.g., 'event:gift', 'action:keyboard') */
  abstract readonly type: NodeType

  /** Node category */
  abstract readonly category: NodeCategory

  /** Human-readable name */
  abstract readonly name: string

  /** Node description */
  abstract readonly description: string

  /** Node icon (emoji or lucide icon name) */
  abstract readonly icon: string

  /** Node color */
  abstract readonly color: string

  /** Logger instance */
  protected logger: Logger

  constructor() {
    this.logger = new Logger(`Node:${this.type}`)
  }

  /**
   * Execute the node logic
   * @param config Node configuration
   * @param context Execution context
   * @returns Node output with signal and data
   */
  abstract execute(
    config: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<NodeOutput>

  /**
   * Validate node configuration
   * @param config Node configuration to validate
   * @returns true if valid, false otherwise
   */
  abstract validate(config: Record<string, unknown>): boolean

  /**
   * Get input port definitions
   */
  abstract getInputs(): NodePortDefinition[]

  /**
   * Get output port definitions
   */
  abstract getOutputs(): NodePortDefinition[]

  /**
   * Get configuration schema
   */
  abstract getConfigSchema(): ConfigSchema

  /**
   * Helper: Get a config value with type safety
   */
  protected getConfig<T>(config: Record<string, unknown>, key: string, defaultValue: T): T {
    const value = config[key]
    if (value === undefined || value === null) return defaultValue
    return value as T
  }

  /**
   * Helper: Create a successful output
   */
  protected success(signal: string, data: Record<string, unknown> = {}): NodeOutput {
    return { signal, data }
  }

  /**
   * Helper: Create a no-op output (no downstream execution)
   */
  protected noop(): NodeOutput {
    return { signal: '', data: {} }
  }
}
