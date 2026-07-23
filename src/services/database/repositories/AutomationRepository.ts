import { getDatabase } from '../index'

export interface AutomationRow {
  id: string
  profile_id: string
  name: string
  description: string | null
  type: string
  enabled: number
  event_type: string
  conditions_json: string
  actions_json: string
  cooldown: number
  max_executions: number | null
  created_at: string
  updated_at: string
}

export interface AutomationHistoryRow {
  id: string
  automation_id: string
  event_id: string
  status: string
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  action_results: string
  error_message: string | null
}

/**
 * AutomationRepository provides database operations for automations
 */
export class AutomationRepository {
  /**
   * Find all automations for a profile
   */
  findByProfileId(profileId: string): AutomationRow[] {
    const db = getDatabase()
    return db.prepare(
      'SELECT * FROM automations WHERE profile_id = ? ORDER BY created_at DESC'
    ).all(profileId) as AutomationRow[]
  }

  /**
   * Find automation by ID
   */
  findById(id: string): AutomationRow | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM automations WHERE id = ?').get(id) as AutomationRow | undefined
  }

  /**
   * Find enabled automations for a profile
   */
  findEnabledByProfileId(profileId: string): AutomationRow[] {
    const db = getDatabase()
    return db.prepare(
      'SELECT * FROM automations WHERE profile_id = ? AND enabled = 1 ORDER BY created_at DESC'
    ).all(profileId) as AutomationRow[]
  }

  /**
   * Find automations by event type
   */
  findByEventType(eventType: string): AutomationRow[] {
    const db = getDatabase()
    return db.prepare(
      'SELECT * FROM automations WHERE event_type = ? OR event_type = "*" ORDER BY created_at DESC'
    ).all(eventType) as AutomationRow[]
  }

  /**
   * Create a new automation
   */
  create(automation: AutomationRow): AutomationRow {
    const db = getDatabase()
    db.prepare(`
      INSERT INTO automations (id, profile_id, name, description, type, enabled, event_type, conditions_json, actions_json, cooldown, max_executions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      automation.id,
      automation.profile_id,
      automation.name,
      automation.description,
      automation.type,
      automation.enabled,
      automation.event_type,
      automation.conditions_json,
      automation.actions_json,
      automation.cooldown,
      automation.max_executions,
      automation.created_at,
      automation.updated_at
    )
    return automation
  }

  /**
   * Update an automation
   */
  update(id: string, data: Partial<AutomationRow>): AutomationRow | undefined {
    const db = getDatabase()
    const fields = Object.keys(data).filter(k => k !== 'id')
    const values = fields.map(k => (data as Record<string, unknown>)[k])

    if (fields.length === 0) return this.findById(id)

    // Always update updated_at
    const setFields = [...fields, 'updated_at']
    const setValues = [...values, new Date().toISOString()]

    const setClause = setFields.map(f => `${f} = ?`).join(', ')
    db.prepare(`UPDATE automations SET ${setClause} WHERE id = ?`).run(...setValues, id)

    return this.findById(id)
  }

  /**
   * Delete an automation
   */
  delete(id: string): void {
    const db = getDatabase()
    db.prepare('DELETE FROM automations WHERE id = ?').run(id)
  }

  /**
   * Toggle automation enabled state
   */
  toggleEnabled(id: string): AutomationRow | undefined {
    const db = getDatabase()
    db.prepare('UPDATE automations SET enabled = NOT enabled, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id)
    return this.findById(id)
  }

  /**
   * Get all automations
   */
  findAll(): AutomationRow[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM automations ORDER BY created_at DESC').all() as AutomationRow[]
  }

  /**
   * Count automations for a profile
   */
  countByProfileId(profileId: string): number {
    const db = getDatabase()
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM automations WHERE profile_id = ?'
    ).get(profileId) as { count: number }
    return result.count
  }

  // ============================================================
  // HISTORY OPERATIONS
  // ============================================================

  /**
   * Create execution history entry
   */
  createHistoryEntry(entry: AutomationHistoryRow): AutomationHistoryRow {
    const db = getDatabase()
    db.prepare(`
      INSERT INTO automation_history (id, automation_id, event_id, status, started_at, completed_at, duration_ms, action_results, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.automation_id,
      entry.event_id,
      entry.status,
      entry.started_at,
      entry.completed_at,
      entry.duration_ms,
      entry.action_results,
      entry.error_message
    )
    return entry
  }

  /**
   * Get execution history for an automation
   */
  getHistoryByAutomationId(automationId: string, limit: number = 50): AutomationHistoryRow[] {
    const db = getDatabase()
    return db.prepare(
      'SELECT * FROM automation_history WHERE automation_id = ? ORDER BY started_at DESC LIMIT ?'
    ).all(automationId, limit) as AutomationHistoryRow[]
  }

  /**
   * Get recent execution history across all automations
   */
  getRecentHistory(limit: number = 100): AutomationHistoryRow[] {
    const db = getDatabase()
    return db.prepare(
      'SELECT * FROM automation_history ORDER BY started_at DESC LIMIT ?'
    ).all(limit) as AutomationHistoryRow[]
  }

  /**
   * Delete old history entries (keep last N days)
   */
  cleanupHistory(daysToKeep: number = 30): number {
    const db = getDatabase()
    const result = db.prepare(
      `DELETE FROM automation_history WHERE started_at < datetime('now', '-' || ? || ' days')`
    ).run(daysToKeep)
    return result.changes
  }
}
