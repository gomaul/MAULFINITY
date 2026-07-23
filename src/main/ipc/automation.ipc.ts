import { IpcMainInvokeEvent } from 'electron'
import { AutomationRepository } from '@services/database/repositories/AutomationRepository'
import { AutomationManager } from '@core/automation/AutomationManager'
import { AutomationEngine } from '@core/automation/AutomationEngine'
import { v4 as uuidv4 } from 'uuid'
import { AutomationConfig, AutomationCondition, AutomationAction } from '@core/automation/types'

const automationRepo = new AutomationRepository()
const automationManager = AutomationManager.getInstance()
const automationEngine = AutomationEngine.getInstance()

/**
 * Parse JSON fields from database row to AutomationConfig
 */
function rowToConfig(row: ReturnType<typeof automationRepo.findById>): AutomationConfig | null {
  if (!row) return null

  return {
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    description: row.description || undefined,
    type: row.type as 'simple' | 'advanced',
    enabled: row.enabled === 1,
    eventType: row.event_type,
    conditions: JSON.parse(row.conditions_json || '[]') as AutomationCondition[],
    actions: JSON.parse(row.actions_json || '[]') as AutomationAction[],
    cooldown: row.cooldown || undefined,
    maxExecutions: row.max_executions || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const automationHandlers = {
  /**
   * List automations for a profile
   */
  async list(_event: IpcMainInvokeEvent, profileId: string): Promise<AutomationConfig[]> {
    const rows = automationRepo.findByProfileId(profileId)
    return rows.map(rowToConfig).filter((c): c is AutomationConfig => c !== null)
  },

  /**
   * Get automation by ID
   */
  async get(_event: IpcMainInvokeEvent, id: string): Promise<AutomationConfig | null> {
    const row = automationRepo.findById(id)
    return rowToConfig(row)
  },

  /**
   * Create a new automation
   */
  async create(_event: IpcMainInvokeEvent, data: {
    profile_id: string
    name: string
    description?: string
    type?: string
    event_type: string
    conditions?: AutomationCondition[]
    actions: AutomationAction[]
    cooldown?: number
  }): Promise<AutomationConfig> {
    const id = uuidv4()
    const now = new Date().toISOString()

    const row = {
      id,
      profile_id: data.profile_id,
      name: data.name,
      description: data.description || null,
      type: data.type || 'simple',
      enabled: 1,
      event_type: data.event_type,
      conditions_json: JSON.stringify(data.conditions || []),
      actions_json: JSON.stringify(data.actions),
      cooldown: data.cooldown || 0,
      max_executions: null,
      created_at: now,
      updated_at: now
    }

    automationRepo.create(row)
    const config = rowToConfig(row)!

    // Add to engine
    automationEngine.addAutomation(config)

    return config
  },

  /**
   * Update an automation
   */
  async update(_event: IpcMainInvokeEvent, id: string, data: Partial<{
    name: string
    description: string
    type: string
    enabled: boolean
    event_type: string
    conditions: AutomationCondition[]
    actions: AutomationAction[]
    cooldown: number
  }>): Promise<AutomationConfig | null> {
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.enabled !== undefined) updateData.enabled = data.enabled ? 1 : 0
    if (data.event_type !== undefined) updateData.event_type = data.event_type
    if (data.conditions !== undefined) updateData.conditions_json = JSON.stringify(data.conditions)
    if (data.actions !== undefined) updateData.actions_json = JSON.stringify(data.actions)
    if (data.cooldown !== undefined) updateData.cooldown = data.cooldown

    const updated = automationRepo.update(id, updateData)
    const config = rowToConfig(updated)

    // Update in engine
    if (config) {
      automationEngine.updateAutomation(id, config)
    }

    return config
  },

  /**
   * Delete an automation
   */
  async delete(_event: IpcMainInvokeEvent, id: string): Promise<void> {
    automationRepo.delete(id)
    automationEngine.removeAutomation(id)
  },

  /**
   * Toggle automation enabled state
   */
  async toggle(_event: IpcMainInvokeEvent, id: string): Promise<AutomationConfig | null> {
    const updated = automationRepo.toggleEnabled(id)
    const config = rowToConfig(updated)

    // Toggle in engine
    automationEngine.toggleAutomation(id)

    return config
  },

  /**
   * Test an automation with a simulated event
   */
  async test(_event: IpcMainInvokeEvent, id: string, testEvent?: Record<string, unknown>): Promise<{
    success: boolean
    executionId: string
    status: string
    duration?: number
    error?: string
  }> {
    try {
      const result = await automationEngine.testAutomation(id, testEvent as any)
      return {
        success: result.status === 'completed',
        executionId: result.executionId,
        status: result.status,
        duration: result.duration,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        executionId: '',
        status: 'failed',
        error: (error as Error).message
      }
    }
  },

  /**
   * Execute an automation manually
   */
  async execute(_event: IpcMainInvokeEvent, id: string, eventData: Record<string, unknown>): Promise<{
    success: boolean
    executionId: string
    status: string
    duration?: number
    error?: string
  }> {
    const automation = automationEngine.getAutomation(id)
    if (!automation) {
      return {
        success: false,
        executionId: '',
        status: 'failed',
        error: `Automation not found: ${id}`
      }
    }

    const event = {
      id: eventData.id as string || `manual_${Date.now()}`,
      type: eventData.type as string || automation.eventType,
      platform: eventData.platform as string || 'manual',
      user: eventData.user as string || 'Manual',
      payload: (eventData.payload as Record<string, unknown>) || {},
      timestamp: Date.now()
    }

    const executor = automationEngine['automationExecutor']
    const result = await executor.execute(automation, event)

    return {
      success: result.status === 'completed',
      executionId: result.executionId,
      status: result.status,
      duration: result.duration,
      error: result.error
    }
  },

  /**
   * Get execution history
   */
  async getHistory(_event: IpcMainInvokeEvent, automationId?: string, limit?: number): Promise<unknown[]> {
    if (automationId) {
      return automationRepo.getHistoryByAutomationId(automationId, limit || 50)
    }
    return automationRepo.getRecentHistory(limit || 100)
  },

  /**
   * Get automation statistics
   */
  async getStats(_event: IpcMainInvokeEvent): Promise<{
    total: number
    enabled: number
    byProfile: Record<string, number>
  }> {
    const all = automationRepo.findAll()
    const enabled = all.filter(a => a.enabled === 1)

    const byProfile: Record<string, number> = {}
    for (const automation of all) {
      byProfile[automation.profile_id] = (byProfile[automation.profile_id] || 0) + 1
    }

    return {
      total: all.length,
      enabled: enabled.length,
      byProfile
    }
  }
}
