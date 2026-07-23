import { EventBus } from '../event-bus/EventBus'
import { MaulfinityEvent } from '../event-bus/types'
import { ConditionMatcher } from './ConditionMatcher'
import { ActionQueue } from './ActionQueue'
import { Trigger } from './types'
import { Logger } from '@services/logger'

const logger = new Logger('TriggerEngine')

export class TriggerEngine {
  private eventBus: EventBus
  private conditionMatcher: ConditionMatcher
  private actionQueue: ActionQueue
  private triggers: Map<string, Trigger> = new Map()

  constructor() {
    this.eventBus = EventBus.getInstance()
    this.conditionMatcher = new ConditionMatcher()
    this.actionQueue = new ActionQueue()
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // Listen to all events
    this.eventBus.on('*', (event) => {
      this.processEvent(event)
    })
  }

  /**
   * Process an incoming event against all active triggers
   */
  async processEvent(event: MaulfinityEvent): Promise<void> {
    logger.info(`Processing event: ${event.type} from ${event.user}`)

    // Find matching triggers
    const matchingTriggers = this.findMatchingTriggers(event)

    if (matchingTriggers.length === 0) {
      logger.info('No matching triggers found')
      return
    }

    logger.info(`Found ${matchingTriggers.length} matching triggers`)

    // Queue actions for each matching trigger
    for (const trigger of matchingTriggers) {
      this.actionQueue.enqueue(trigger.actions, event)
    }
  }

  /**
   * Find triggers that match the given event
   */
  private findMatchingTriggers(event: MaulfinityEvent): Trigger[] {
    const matching: Trigger[] = []

    for (const trigger of this.triggers.values()) {
      if (!trigger.enabled) continue

      // Check if event type matches
      if (trigger.eventType !== event.type) continue

      // Check if conditions match
      if (this.conditionMatcher.match(trigger.condition, event)) {
        matching.push(trigger)
      }
    }

    return matching
  }

  /**
   * Load triggers from database
   */
  loadTriggers(triggers: Trigger[]): void {
    this.triggers.clear()
    for (const trigger of triggers) {
      this.triggers.set(trigger.id, trigger)
    }
    logger.info(`Loaded ${triggers.length} triggers`)
  }

  /**
   * Add a new trigger
   */
  addTrigger(trigger: Trigger): void {
    this.triggers.set(trigger.id, trigger)
  }

  /**
   * Remove a trigger
   */
  removeTrigger(id: string): void {
    this.triggers.delete(id)
  }
}
