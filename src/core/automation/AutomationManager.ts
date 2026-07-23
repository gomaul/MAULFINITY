import { AutomationEngine } from './AutomationEngine'
import { AutomationConfig, AutomationFilter } from './types'
import { Logger } from '@services/logger'

const logger = new Logger('AutomationManager')

/**
 * AutomationManager provides high-level CRUD operations for automations
 * 
 * Responsibilities:
 * - Create, Read, Update, Delete automations
 * - Validation of automation configs
 * - Integration with AutomationEngine
 * - Profile-based automation management
 */
export class AutomationManager {
  private static instance: AutomationManager
  private engine: AutomationEngine

  private constructor() {
    this.engine = AutomationEngine.getInstance()
  }

  static getInstance(): AutomationManager {
    if (!AutomationManager.instance) {
      AutomationManager.instance = new AutomationManager()
    }
    return AutomationManager.instance
  }

  /**
   * Create a new automation
   */
  create(config: Omit<AutomationConfig, 'id' | 'createdAt' | 'updatedAt'>): AutomationConfig {
    const id = this.generateId()
    const now = new Date().toISOString()

    const automation: AutomationConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now
    }

    // Validate
    const validationError = this.validate(automation)
    if (validationError) {
      throw new Error(`Validation error: ${validationError}`)
    }

    // Add to engine
    this.engine.addAutomation(automation)

    logger.info(`Created automation: ${automation.name} (${id})`)
    return automation
  }

  /**
   * Get automation by ID
   */
  getById(id: string): AutomationConfig | undefined {
    return this.engine.getAutomation(id)
  }

  /**
   * List automations with optional filter
   */
  list(filter?: AutomationFilter): AutomationConfig[] {
    let automations = this.engine.getAutomations()

    if (filter) {
      if (filter.profileId) {
        automations = automations.filter(a => a.profileId === filter.profileId)
      }
      if (filter.enabled !== undefined) {
        automations = automations.filter(a => a.enabled === filter.enabled)
      }
      if (filter.eventType) {
        automations = automations.filter(a => a.eventType === filter.eventType)
      }
      if (filter.type) {
        automations = automations.filter(a => a.type === filter.type)
      }
    }

    return automations
  }

  /**
   * Update an automation
   */
  update(id: string, updates: Partial<AutomationConfig>): AutomationConfig | undefined {
    const existing = this.engine.getAutomation(id)
    if (!existing) {
      logger.warning(`Automation not found: ${id}`)
      return undefined
    }

    // Merge updates
    const updated: AutomationConfig = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    }

    // Validate
    const validationError = this.validate(updated)
    if (validationError) {
      throw new Error(`Validation error: ${validationError}`)
    }

    // Update in engine
    this.engine.updateAutomation(id, updates)

    logger.info(`Updated automation: ${updated.name}`)
    return updated
  }

  /**
   * Delete an automation
   */
  delete(id: string): boolean {
    const automation = this.engine.getAutomation(id)
    if (!automation) {
      logger.warning(`Automation not found: ${id}`)
      return false
    }

    this.engine.removeAutomation(id)
    logger.info(`Deleted automation: ${automation.name}`)
    return true
  }

  /**
   * Toggle automation enabled state
   */
  toggle(id: string): boolean {
    return this.engine.toggleAutomation(id)
  }

  /**
   * Test an automation
   */
  async test(id: string, testEvent?: Partial<import('@core/event-bus/types').MaulfinityEvent>) {
    return this.engine.testAutomation(id, testEvent)
  }

  /**
   * Load automations from database
   */
  loadAll(automations: AutomationConfig[]): void {
    this.engine.loadAutomations(automations)
  }

  /**
   * Validate automation config
   */
  private validate(config: AutomationConfig): string | null {
    if (!config.name || config.name.trim().length === 0) {
      return 'Name is required'
    }

    if (!config.eventType || config.eventType.trim().length === 0) {
      return 'Event type is required'
    }

    if (!config.profileId || config.profileId.trim().length === 0) {
      return 'Profile ID is required'
    }

    if (!config.actions || config.actions.length === 0) {
      return 'At least one action is required'
    }

    // Validate each action has a type
    for (const action of config.actions) {
      if (!action.type || action.type.trim().length === 0) {
        return 'Action type is required'
      }
    }

    return null
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `auto_${timestamp}_${random}`
  }
}
