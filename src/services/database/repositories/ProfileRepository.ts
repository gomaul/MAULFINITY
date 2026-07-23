import { getDatabase } from '../index'

export interface Profile {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export class ProfileRepository {
  findAll(): Profile[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM profiles ORDER BY created_at DESC').all() as Profile[]
  }

  findById(id: string): Profile | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as Profile | undefined
  }

  create(profile: Profile): Profile {
    const db = getDatabase()
    db.prepare(`
      INSERT INTO profiles (id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(profile.id, profile.name, profile.description, profile.created_at, profile.updated_at)
    return profile
  }

  update(id: string, data: Partial<Profile>): Profile | undefined {
    const db = getDatabase()
    const fields = Object.keys(data).filter(k => k !== 'id')
    const values = fields.map(k => (data as Record<string, unknown>)[k])
    
    if (fields.length === 0) return this.findById(id)
    
    const setClause = fields.map(f => `${f} = ?`).join(', ')
    db.prepare(`UPDATE profiles SET ${setClause} WHERE id = ?`).run(...values, id)
    
    return this.findById(id)
  }

  delete(id: string): void {
    const db = getDatabase()
    db.prepare('DELETE FROM profiles WHERE id = ?').run(id)
  }
}
