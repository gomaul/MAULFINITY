import { getDatabase } from '@services/database'
import { v4 as uuidv4 } from 'uuid'

/**
 * GameRepository - Database operations for games
 */
export class GameRepository {
  /**
   * Find all games
   */
  findAll(): GameRow[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM games ORDER BY name').all() as GameRow[]
  }

  /**
   * Find game by ID
   */
  findById(id: string): GameRow | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM games WHERE id = ?').get(id) as GameRow | undefined
  }

  /**
   * Find games by status
   */
  findByStatus(status: string): GameRow[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM games WHERE status = ? ORDER BY name').all(status) as GameRow[]
  }

  /**
   * Create a new game
   */
  create(game: Omit<GameRow, 'created_at' | 'updated_at'>): GameRow {
    const db = getDatabase()
    const id = game.id || uuidv4()
    
    db.prepare(`
      INSERT INTO games (id, name, version, adapter, adapter_version, description, icon, platform, status, enabled, settings_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      game.name,
      game.version || '1.0.0',
      game.adapter,
      game.adapter_version || '1.0.0',
      game.description || null,
      game.icon || null,
      game.platform || 'pc',
      game.status || 'installed',
      game.enabled ?? 1,
      game.settings_json || '{}'
    )

    return this.findById(id)!
  }

  /**
   * Update a game
   */
  update(id: string, updates: Partial<GameRow>): boolean {
    const db = getDatabase()
    
    const setClauses: string[] = []
    const values: unknown[] = []

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'id' || key === 'created_at') continue
      setClauses.push(`${key} = ?`)
      values.push(value)
    }

    if (setClauses.length === 0) return false

    setClauses.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const result = db.prepare(`
      UPDATE games SET ${setClauses.join(', ')} WHERE id = ?
    `).run(...values)

    return result.changes > 0
  }

  /**
   * Delete a game
   */
  delete(id: string): boolean {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM games WHERE id = ?').run(id)
    return result.changes > 0
  }

  /**
   * Enable/disable game
   */
  setEnabled(id: string, enabled: boolean): boolean {
    return this.update(id, { enabled: enabled ? 1 : 0 })
  }

  /**
   * Update game status
   */
  updateStatus(id: string, status: string): boolean {
    return this.update(id, { status })
  }

  /**
   * Update last used timestamp
   */
  updateLastUsed(id: string): boolean {
    return this.update(id, { last_used_at: new Date().toISOString() })
  }
}

/**
 * Game row type
 */
export interface GameRow {
  id: string
  name: string
  version: string
  adapter: string
  adapter_version: string
  description: string | null
  icon: string | null
  platform: string
  status: string
  enabled: number
  settings_json: string
  installed_at: string
  last_used_at: string | null
  created_at: string
  updated_at: string
}
