import { MaulfinityEvent } from '../event-bus/types'
import { TriggerAction } from './types'
import { ActionEngine } from '../action-engine/ActionEngine'
import { Logger } from '@services/logger'

const logger = new Logger('ActionQueue')

interface QueuedAction {
  actions: TriggerAction[]
  event: MaulfinityEvent
}

export class ActionQueue {
  private queue: QueuedAction[] = []
  private isProcessing = false
  private actionEngine: ActionEngine

  constructor() {
    this.actionEngine = ActionEngine.getInstance()
  }

  /**
   * Add actions to the queue
   */
  enqueue(actions: TriggerAction[], event: MaulfinityEvent): void {
    this.queue.push({ actions, event })
    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  /**
   * Process the action queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true

    while (this.queue.length > 0) {
      const item = this.queue.shift()!
      await this.executeActions(item.actions, item.event)
    }

    this.isProcessing = false
  }

  /**
   * Execute a set of actions
   */
  private async executeActions(actions: TriggerAction[], event: MaulfinityEvent): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeAction(action, event)
      } catch (error) {
        logger.error(`Failed to execute action: ${action.type}`, error as Error)
      }
    }
  }

  /**
   * Execute a single action via ActionEngine
   */
  private async executeAction(action: TriggerAction, event: MaulfinityEvent): Promise<void> {
    logger.info(`Dispatching action: ${action.type}`)
    await this.actionEngine.execute(action.type, action.config, event)
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = []
  }
}
