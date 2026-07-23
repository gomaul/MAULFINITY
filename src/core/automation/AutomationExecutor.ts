import { MaulfinityEvent } from '@core/event-bus/types'
import { ActionEngine } from '@core/action-engine/ActionEngine'
import { Logger } from '@services/logger'
import {
  AutomationConfig,
  AutomationAction,
  ExecutionContext,
  ActionResult,
  AutomationExecutionResult,
  VariableStore,
  CounterStore,
  CooldownStore,
  AutomationLogger
} from './types'

const logger = new Logger('AutomationExecutor')

/**
 * Simple variable store implementation
 */
class SimpleVariableStore implements VariableStore {
  private variables: Map<string, unknown> = new Map()

  get(name: string): unknown {
    return this.variables.get(name)
  }

  set(name: string, value: unknown): void {
    this.variables.set(name, value)
  }

  has(name: string): boolean {
    return this.variables.has(name)
  }

  getAll(): Record<string, unknown> {
    return Object.fromEntries(this.variables)
  }
}

/**
 * Simple counter store implementation
 */
class SimpleCounterStore implements CounterStore {
  private counters: Map<string, number> = new Map()

  get(name: string): number {
    return this.counters.get(name) ?? 0
  }

  increment(name: string, amount: number = 1): number {
    const current = this.get(name)
    const newValue = current + amount
    this.counters.set(name, newValue)
    return newValue
  }

  decrement(name: string, amount: number = 1): number {
    return this.increment(name, -amount)
  }

  reset(name: string): void {
    this.counters.set(name, 0)
  }

  getAll(): Record<string, number> {
    return Object.fromEntries(this.counters)
  }
}

/**
 * Simple cooldown store implementation
 */
class SimpleCooldownStore implements CooldownStore {
  private cooldowns: Map<string, number> = new Map()

  isOnCooldown(key: string): boolean {
    const expiresAt = this.cooldowns.get(key)
    if (!expiresAt) return false
    return Date.now() < expiresAt
  }

  setCooldown(key: string, durationSeconds: number): void {
    const expiresAt = Date.now() + durationSeconds * 1000
    this.cooldowns.set(key, expiresAt)
  }

  getRemainingCooldown(key: string): number {
    const expiresAt = this.cooldowns.get(key)
    if (!expiresAt) return 0
    const remaining = Math.max(0, expiresAt - Date.now())
    return Math.ceil(remaining / 1000)
  }

  clear(key: string): void {
    this.cooldowns.delete(key)
  }
}

/**
 * Simple automation logger
 */
class AutomationLoggerImpl implements AutomationLogger {
  private prefix: string

  constructor(automationId: string) {
    this.prefix = `[Automation:${automationId}]`
  }

  info(message: string): void {
    logger.info(`${this.prefix} ${message}`)
  }

  warning(message: string): void {
    logger.warning(`${this.prefix} ${message}`)
  }

  error(message: string, error?: Error): void {
    logger.error(`${this.prefix} ${message}`, error)
  }

  debug(message: string): void {
    logger.debug(`${this.prefix} ${message}`)
  }
}

/**
 * AutomationExecutor handles the execution of automation actions
 * 
 * Responsibilities:
 * - Create execution context
 * - Execute actions in order
 * - Handle delays between actions
 * - Track execution results
 * - Error handling and recovery
 */
export class AutomationExecutor {
  private actionEngine: ActionEngine

  constructor() {
    this.actionEngine = ActionEngine.getInstance()
  }

  /**
   * Execute an automation
   */
  async execute(
    automation: AutomationConfig,
    event: MaulfinityEvent,
    executionId?: string
  ): Promise<AutomationExecutionResult> {
    const execId = executionId || this.generateExecutionId()
    const startTime = Date.now()

    logger.info(`Executing automation: ${automation.name} (${execId})`)

    // Create execution context
    const context = this.createContext(automation, event, execId)

    const result: AutomationExecutionResult = {
      executionId: execId,
      automationId: automation.id,
      status: 'running',
      eventId: event.id,
      startedAt: startTime,
      actionResults: []
    }

    try {
      // Sort actions by order
      const sortedActions = this.sortActions(automation.actions)

      // Execute each action
      for (const action of sortedActions) {
        // Handle delay if specified
        if (action.delay && action.delay > 0) {
          context.logger.debug(`Waiting ${action.delay}ms before executing ${action.type}`)
          await this.delay(action.delay)
        }

        // Execute the action
        const actionResult = await this.executeAction(action, context)
        result.actionResults.push(actionResult)

        if (!actionResult.success) {
          context.logger.warning(`Action ${action.type} failed: ${actionResult.error}`)
          // Continue with other actions even if one fails
        }
      }

      result.status = 'completed'
      result.completedAt = Date.now()
      result.duration = result.completedAt - startTime

      context.logger.info(`Automation completed in ${result.duration}ms`)
    } catch (error) {
      result.status = 'failed'
      result.completedAt = Date.now()
      result.duration = result.completedAt - startTime
      result.error = (error as Error).message

      context.logger.error(`Automation execution failed: ${result.error}`, error as Error)
    }

    return result
  }

  /**
   * Create execution context
   */
  private createContext(
    automation: AutomationConfig,
    event: MaulfinityEvent,
    executionId: string
  ): ExecutionContext {
    return {
      event,
      automation,
      executionId,
      timestamp: Date.now(),
      variables: new SimpleVariableStore(),
      counters: new SimpleCounterStore(),
      cooldowns: new SimpleCooldownStore(),
      logger: new AutomationLoggerImpl(automation.id)
    }
  }

  /**
   * Sort actions by order
   */
  private sortActions(actions: AutomationAction[]): AutomationAction[] {
    return [...actions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: AutomationAction,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const startTime = Date.now()

    try {
      // Check if action type is registered
      if (!this.actionEngine.hasAction(action.type)) {
        return {
          actionType: action.type,
          success: false,
          duration: Date.now() - startTime,
          error: `Action type '${action.type}' is not registered`
        }
      }

      // Execute via ActionEngine
      await this.actionEngine.execute(action.type, action.config, context.event)

      return {
        actionType: action.type,
        success: true,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        actionType: action.type,
        success: false,
        duration: Date.now() - startTime,
        error: (error as Error).message
      }
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `exec_${timestamp}_${random}`
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
