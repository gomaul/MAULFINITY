import { getDatabase } from '../index'

export interface Plugin {
  id: string
  name: string
  version: string
  enabled: number
  permissions: string | null
}

export class PluginRepository {
  findAll(): Plugin[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM plugins ORDER BY name').all() as Plugin[]
  }

  findById(id: string): Plugin | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM plugins WHERE id = ?').get(id) as Plugin | undefined
  }

  create(plugin: Plugin): Plugin {
    const db = getDatabase()
    db.prepare(`
      INSERT INTO plugins (id, name, version, enabled, permissions)
      VALUES (?, ?, ?, ?, ?)
    `).run(plugin.id, plugin.name, plugin.version, plugin.enabled, plugin.permissions)
    return plugin
  }

  update(id: string, data: Partial<Plugin>): Plugin | undefined {
    const db = getDatabase()
    const fields = Object.keys(data).filter(k => k !== 'id')
    const values = fields.map(k => (data as Record<string, unknown>)[k])
    
    if (fields.length === 0) return this.findById(id)
    
    const setClause = fields.map(f => `${f} = ?`).join(', ')
    db.prepare(`UPDATE plugins SET ${setClause} WHERE id = ?`).run(...values, id)
    
    return this.findById(id)
  }

  delete(id: string): void {
    const db = getDatabase()
    db.prepare('DELETE FROM plugins WHERE id = ?').run(id)
  }

  toggleEnabled(id: string): Plugin | undefined {
    const db = getDatabase()
    db.prepare('UPDATE plugins SET enabled = NOT enabled WHERE id = ?').run(id)
    return this.findById(id)
  }
}
