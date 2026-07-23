import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../index'

/**
 * Graph row from database
 */
export interface GraphRow {
  id: string
  name: string
  description: string | null
  version: string
  author: string | null
  tags: string
  graph_data: string
  profile_id: string
  enabled: number
  created_at: string
  updated_at: string
}

/**
 * GraphVariable row from database
 */
export interface GraphVariableRow {
  id: string
  graph_id: string
  name: string
  type: string
  value: string
  profile_id: string
  created_at: string
  updated_at: string
}

/**
 * GraphExecution row from database
 */
export interface GraphExecutionRow {
  id: string
  graph_id: string
  event_id: string
  status: string
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  nodes_executed: number | null
  error_message: string | null
}

/**
 * GraphRepository - Database operations for automation graphs
 */
export class GraphRepository {
  private db: Database.Database

  constructor() {
    this.db = getDatabase()
  }

  // ============================================================
  // GRAPH OPERATIONS
  // ============================================================

  /**
   * Find all graphs
   */
  findAll(): GraphRow[] {
    return this.db.prepare('SELECT * FROM automation_graphs ORDER BY updated_at DESC').all() as GraphRow[]
  }

  /**
   * Find graph by ID
   */
  findById(id: string): GraphRow | undefined {
    return this.db.prepare('SELECT * FROM automation_graphs WHERE id = ?').get(id) as GraphRow | undefined
  }

  /**
   * Find graphs by profile ID
   */
  findByProfileId(profileId: string): GraphRow[] {
    return this.db.prepare('SELECT * FROM automation_graphs WHERE profile_id = ? ORDER BY updated_at DESC').all(profileId) as GraphRow[]
  }

  /**
   * Find enabled graphs
   */
  findEnabled(): GraphRow[] {
    return this.db.prepare('SELECT * FROM automation_graphs WHERE enabled = 1').all() as GraphRow[]
  }

  /**
   * Create a new graph
   */
  create(data: {
    name: string
    description?: string
    version?: string
    author?: string
    tags?: string[]
    graph_data: Record<string, unknown>
    profile_id: string
    enabled?: number
  }): GraphRow {
    const id = uuidv4()
    const now = new Date().toISOString()

    const stmt = this.db.prepare(`
      INSERT INTO automation_graphs (id, name, description, version, author, tags, graph_data, profile_id, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      data.name,
      data.description || null,
      data.version || '1.0.0',
      data.author || 'User',
      JSON.stringify(data.tags || []),
      JSON.stringify(data.graph_data),
      data.profile_id,
      data.enabled ?? 1,
      now,
      now
    )

    return this.findById(id)!
  }

  /**
   * Update a graph
   */
  update(id: string, data: Partial<{
    name: string
    description: string
    version: string
    author: string
    tags: string[]
    graph_data: Record<string, unknown>
    profile_id: string
    enabled: number
  }>): GraphRow | undefined {
    const existing = this.findById(id)
    if (!existing) return undefined

    const updates: string[] = []
    const values: unknown[] = []

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name) }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description) }
    if (data.version !== undefined) { updates.push('version = ?'); values.push(data.version) }
    if (data.author !== undefined) { updates.push('author = ?'); values.push(data.author) }
    if (data.tags !== undefined) { updates.push('tags = ?'); values.push(JSON.stringify(data.tags)) }
    if (data.graph_data !== undefined) { updates.push('graph_data = ?'); values.push(JSON.stringify(data.graph_data)) }
    if (data.profile_id !== undefined) { updates.push('profile_id = ?'); values.push(data.profile_id) }
    if (data.enabled !== undefined) { updates.push('enabled = ?'); values.push(data.enabled) }

    if (updates.length === 0) return existing

    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    this.db.prepare(`UPDATE automation_graphs SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    return this.findById(id)
  }

  /**
   * Delete a graph
   */
  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM automation_graphs WHERE id = ?').run(id)
    return result.changes > 0
  }

  /**
   * Toggle graph enabled state
   */
  toggleEnabled(id: string): GraphRow | undefined {
    const existing = this.findById(id)
    if (!existing) return undefined

    const newEnabled = existing.enabled === 1 ? 0 : 1
    this.db.prepare('UPDATE automation_graphs SET enabled = ?, updated_at = ? WHERE id = ?')
      .run(newEnabled, new Date().toISOString(), id)

    return this.findById(id)
  }

  /**
   * Get graph count
   */
  count(): number {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM automation_graphs').get() as { count: number }
    return result.count
  }

  // ============================================================
  // GRAPH VARIABLE OPERATIONS
  // ============================================================

  /**
   * Get variables for a graph
   */
  getVariables(graphId: string): GraphVariableRow[] {
    return this.db.prepare('SELECT * FROM graph_variables WHERE graph_id = ?').all(graphId) as GraphVariableRow[]
  }

  /**
   * Set a variable value
   */
  setVariable(graphId: string, name: string, value: unknown, profileId: string = 'default'): GraphVariableRow {
    const id = uuidv4()
    const now = new Date().toISOString()

    // Upsert logic
    const existing = this.db.prepare('SELECT id FROM graph_variables WHERE graph_id = ? AND name = ?').get(graphId, name) as { id: string } | undefined

    if (existing) {
      this.db.prepare('UPDATE graph_variables SET value = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify(value), now, existing.id)
      return this.db.prepare('SELECT * FROM graph_variables WHERE id = ?').get(existing.id) as GraphVariableRow
    }

    this.db.prepare(`
      INSERT INTO graph_variables (id, graph_id, name, type, value, profile_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, graphId, name, typeof value, JSON.stringify(value), profileId, now, now)

    return this.db.prepare('SELECT * FROM graph_variables WHERE id = ?').get(id) as GraphVariableRow
  }

  /**
   * Delete a variable
   */
  deleteVariable(graphId: string, name: string): boolean {
    const result = this.db.prepare('DELETE FROM graph_variables WHERE graph_id = ? AND name = ?').run(graphId, name)
    return result.changes > 0
  }

  // ============================================================
  // EXECUTION HISTORY OPERATIONS
  // ============================================================

  /**
   * Record an execution
   */
  recordExecution(data: {
    graph_id: string
    event_id: string
    status: string
    duration_ms?: number
    nodes_executed?: number
    error_message?: string
  }): GraphExecutionRow {
    const id = uuidv4()
    const now = new Date().toISOString()

    this.db.prepare(`
      INSERT INTO graph_executions (id, graph_id, event_id, status, started_at, completed_at, duration_ms, nodes_executed, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.graph_id, data.event_id, data.status, now,
      data.status !== 'running' ? now : null,
      data.duration_ms || null,
      data.nodes_executed || 0,
      data.error_message || null
    )

    return this.db.prepare('SELECT * FROM graph_executions WHERE id = ?').get(id) as GraphExecutionRow
  }

  /**
   * Get execution history for a graph
   */
  getExecutions(graphId: string, limit: number = 50): GraphExecutionRow[] {
    return this.db.prepare(
      'SELECT * FROM graph_executions WHERE graph_id = ? ORDER BY started_at DESC LIMIT ?'
    ).all(graphId, limit) as GraphExecutionRow[]
  }

  /**
   * Get recent executions across all graphs
   */
  getRecentExecutions(limit: number = 100): GraphExecutionRow[] {
    return this.db.prepare(
      'SELECT * FROM graph_executions ORDER BY started_at DESC LIMIT ?'
    ).all(limit) as GraphExecutionRow[]
  }
}
