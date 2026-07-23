import { getDatabase } from '../index'

export interface Trigger {
  id: string
  profile_id: string
  name: string
  event_type: string
  condition_json: string
  actions_json: string
  enabled: number
  created_at: string
}

export class TriggerRepository {
  findByProfileId(profileId: string): Trigger[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM triggers WHERE profile_id = ? ORDER BY created_at DESC').all(profileId) as Trigger[]
  }

  findById(id: string): Trigger | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM triggers WHERE id = ?').get(id) as Trigger | undefined
  }

  create(trigger: Trigger): Trigger {
    const db = getDatabase()
    db.prepare(`
      INSERT INTO triggers (id, profile_id, name, event_type, condition_json, actions_json, enabled, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(trigger.id, trigger.profile_id, trigger.name, trigger.event_type, trigger.condition_json, trigger.actions_json, trigger.enabled, trigger.created_at)
    return trigger
  }

  update(id: string, data: Partial<Trigger>): Trigger | undefined {
    const db = getDatabase()
    const fields = Object.keys(data).filter(k => k !== 'id')
    const values = fields.map(k => (data as Record<string, unknown>)[k])
    
    if (fields.length === 0) return this.findById(id)
    
    const setClause = fields.map(f => `${f} = ?`).join(', ')
    db.prepare(`UPDATE triggers SET ${setClause} WHERE id = ?`).run(...values, id)
    
    return this.findById(id)
  }

  delete(id: string): void {
    const db = getDatabase()
    db.prepare('DELETE FROM triggers WHERE id = ?').run(id)
  }

  toggleEnabled(id: string): Trigger | undefined {
    const db = getDatabase()
    db.prepare('UPDATE triggers SET enabled = NOT enabled WHERE id = ?').run(id)
    return this.findById(id)
  }
}
