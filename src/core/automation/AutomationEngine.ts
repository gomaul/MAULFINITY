import { EventBus } from '@core/event-bus/EventBus'
import { MaulfinityEvent } from '@core/event-bus/types'
import { Logger } from '@services/logger'
import { ConditionEvaluator } from './conditions/ConditionEvaluator'
import { AutomationExecutor } from './AutomationExecutor'
import {
  AutomationConfig,
  AutomationExecutionResult,
  AutomationStats,
  CooldownStore
} from './types'

const logger = new Logger('AutomationEngine')

/**
 * Simple cooldown store for the engine
 */
class EngineCooldownStore implements CooldownStore {
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
 * AutomationEngine is the central orchestrator for automation execution
 * 
 * Responsibilities:
 * - Listen to EventBus for incoming events
 * - Match events against automation rules
 * - Execute matching automations
 * - Track execution history and statistics
 * - Handle cooldowns and rate limiting
 * 
 * Architecture:
 * EventBus → AutomationEngine → ConditionEvaluator → AutomationExecutor → ActionEngine
 */
export class AutomationEngine {
  private static instance: AutomationEngine
  private eventBus: EventBus
  private conditionEvaluator: ConditionEvaluator
  private automationExecutor: AutomationExecutor
  private cooldownStore: EngineCooldownStore

  /** Loaded automations indexed by ID */
  private automations: Map<string, AutomationConfig> = new Map()

  /** Execution history (limited buffer) */
  private executionHistory: AutomationExecutionResult[] = []
  private maxHistorySize: number = 100

  /** Statistics */
  private stats: AutomationStats = {
    totalAutomations: 0,
    enabledAutomations: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0
  }

  /** Event unsubscribe function */
  private unsubscribeEventBus?: () => void

  private constructor() {
    this.eventBus = EventBus.getInstance()
    this.conditionEvaluator = new ConditionEvaluator()
    this.automationExecutor = new AutomationExecutor()
    this.cooldownStore = new EngineCooldownStore()
  }

  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine()
    }
    return AutomationEngine.instance
  }

  /**
   * Initialize the automation engine
   * Subscribes to EventBus for all events
   */
  initialize(): void {
    logger.info('Initializing AutomationEngine...')

    // Subscribe to all events using wildcard
    this.unsubscribeEventBus = this.eventBus.on('*', (event) => {
      this.handleEvent(event)
    }, 'AutomationEngine')

    logger.info('AutomationEngine initialized and listening to EventBus')
  }

  /**
   * Shutdown the automation engine
   */
  shutdown(): void {
    logger.info('Shutting down AutomationEngine...')

    if (this.unsubscribeEventBus) {
      this.unsubscribeEventBus()
      this.unsubscribeEventBus = undefined
    }

    this.automations.clear()
    logger.info('AutomationEngine shutdown complete')
  }

  /**
   * Handle incoming event from EventBus
   */
  private async handleEvent(event: MaulfinityEvent): Promise<void> {
    logger.debug(`Received event: ${event.type} from ${event.user}`)

    // Find matching automations
    const matchingAutomations = this.findMatchingAutomations(event)

    if (matchingAutomations.length === 0) {
      logger.debug('No matching automations found')
      return
    }

    logger.info(`Found ${matchingAutomations.length} matching automations for event ${event.type}`)

    // Execute each matching automation
    for (const automation of matchingAutomations) {
      try {
        const result = await this.automationExecutor.execute(automation, event)
        // Add to history
        this.addToHistory(result)
      } catch (error) {
        logger.error(`Failed to execute automation: ${automation.name}`, error as Error)
      }
    }
  }

  /**
   * Find automations that match the given event
   */
  private findMatchingAutomations(event: MaulfinityEvent): AutomationConfig[] {
    const matching: AutomationConfig[] = []

    for (const automation of this.automations.values()) {
      // Skip disabled automations
      if (!automation.enabled) continue

      // Check if event type matches
      if (automation.eventType !== event.type && automation.eventType !== '*') continue

      // Check cooldown
      if (automation.cooldown && automation.cooldown > 0) {
        const cooldownKey = `auto_${automation.id}`
        if (this.cooldownStore.isOnCooldown(cooldownKey)) {
          logger.debug(`Automation ${automation.name} is on cooldown`)
          continue
        }
      }

      // Evaluate conditions
      if (this.conditionEvaluator.evaluateAll(automation.conditions, event, this.cooldownStore)) {
        matching.push(automation)

        // Set cooldown after matching
        if (automation.cooldown && automation.cooldown > 0) {
          const cooldownKey = `auto_${automation.id}`
          this.cooldownStore.setCooldown(cooldownKey, automation.cooldown)
        }
      }
    }

    return matching
  }

  // ============================================================
  // AUTOMATION MANAGEMENT
  // ============================================================

  /**
   * Load automations from database/config
   */
  loadAutomations(automations: AutomationConfig[]): void {
    this.automations.clear()
    for (const automation of automations) {
      this.automations.set(automation.id, automation)
    }
    this.updateStats()
    logger.info(`Loaded ${automations.length} automations`)
  }

  /**
   * Add a new automation
   */
  addAutomation(automation: AutomationConfig): void {
    this.automations.set(automation.id, automation)
    this.updateStats()
    logger.info(`Added automation: ${automation.name}`)
  }

  /**
   * Update an automation
   */
  updateAutomation(id: string, updates: Partial<AutomationConfig>): void {
    const existing = this.automations.get(id)
    if (!existing) {
      logger.warning(`Automation not found: ${id}`)
      return
    }

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    this.automations.set(id, updated)
    logger.info(`Updated automation: ${updated.name}`)
  }

  /**
   * Remove an automation
   */
  removeAutomation(id: string): void {
    const automation = this.automations.get(id)
    if (automation) {
      this.automations.delete(id)
      this.updateStats()
      logger.info(`Removed automation: ${automation.name}`)
    }
  }

  /**
   * Toggle automation enabled state
   */
  toggleAutomation(id: string): boolean {
    const automation = this.automations.get(id)
    if (!automation) {
      logger.warning(`Automation not found: ${id}`)
      return false
    }

    automation.enabled = !automation.enabled
    automation.updatedAt = new Date().toISOString()
    this.updateStats()
    logger.info(`Toggled automation: ${automation.name} → ${automation.enabled ? 'enabled' : 'disabled'}`)
    return automation.enabled
  }

  /**
   * Get all automations
   */
  getAutomations(): AutomationConfig[] {
    return Array.from(this.automations.values())
  }

  /**
   * Get automation by ID
   */
  getAutomation(id: string): AutomationConfig | undefined {
    return this.automations.get(id)
  }

  /**
   * Get automations by profile ID
   */
  getAutomationsByProfile(profileId: string): AutomationConfig[] {
    return this.getAutomations().filter(a => a.profileId === profileId)
  }

  /**
   * Get automations by event type
   */
  getAutomationsByEventType(eventType: string): AutomationConfig[] {
    return this.getAutomations().filter(a => a.eventType === eventType || a.eventType === '*')
  }

  // ============================================================
  // TESTING & DEBUGGING
  // ============================================================

  /**
   * Test an automation with a simulated event
   */
  async testAutomation(
    automationId: string,
    testEvent?: Partial<MaulfinityEvent>
  ): Promise<AutomationExecutionResult> {
    const automation = this.automations.get(automationId)
    if (!automation) {
      throw new Error(`Automation not found: ${automationId}`)
    }

    // Create test event if not provided
    const event: MaulfinityEvent = {
      id: testEvent?.id || `test_${Date.now()}`,
      type: testEvent?.type || automation.eventType,
      platform: testEvent?.platform || 'test',
      user: testEvent?.user || 'TestUser',
      payload: testEvent?.payload || {},
      timestamp: testEvent?.timestamp || Date.now()
    }

    logger.info(`Testing automation: ${automation.name}`)
    return this.automationExecutor.execute(automation, event)
  }

  // ============================================================
  // STATISTICS & HISTORY
  // ============================================================

  /**
   * Get automation statistics
   */
  getStats(): AutomationStats {
    return { ...this.stats }
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit?: number): AutomationExecutionResult[] {
    if (limit) {
      return this.executionHistory.slice(-limit)
    }
    return [...this.executionHistory]
  }

  /**
   * Add to execution history
   */
  addToHistory(result: AutomationExecutionResult): void {
    this.executionHistory.push(result)
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift()
    }

    // Update stats
    this.stats.totalExecutions++
    if (result.status === 'completed') {
      this.stats.successfulExecutions++
    } else if (result.status === 'failed') {
      this.stats.failedExecutions++
    }

    // Update average execution time
    if (result.duration) {
      const total = this.stats.averageExecutionTime * (this.stats.totalExecutions - 1)
      this.stats.averageExecutionTime = (total + result.duration) / this.stats.totalExecutions
    }
  }

  /**
   * Update internal statistics
   */
  private updateStats(): void {
    this.stats.totalAutomations = this.automations.size
    this.stats.enabledAutomations = Array.from(this.automations.values())
      .filter(a => a.enabled).length
  }
}
