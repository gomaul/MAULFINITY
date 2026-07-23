import { getDatabase } from '../index'

export interface Overlay {
  id: string
  profile_id: string
  name: string
  scene_json: string
  created_at: string
  updated_at: string
}

export class OverlayRepository {
  findByProfileId(profileId: string): Overlay[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM overlays WHERE profile_id = ? ORDER BY created_at DESC').all(profileId) as Overlay[]
  }

  findById(id: string): Overlay | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM overlays WHERE id = ?').get(id) as Overlay | undefined
  }

  create(overlay: Overlay): Overlay {
    const db = getDatabase()
    db.prepare(`
      INSERT INTO overlays (id, profile_id, name, scene_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(overlay.id, overlay.profile_id, overlay.name, overlay.scene_json, overlay.created_at, overlay.updated_at)
    return overlay
  }

  update(id: string, data: Partial<Overlay>): Overlay | undefined {
    const db = getDatabase()
    const fields = Object.keys(data).filter(k => k !== 'id')
    const values = fields.map(k => (data as Record<string, unknown>)[k])
    
    if (fields.length === 0) return this.findById(id)
    
    const setClause = fields.map(f => `${f} = ?`).join(', ')
    db.prepare(`UPDATE overlays SET ${setClause} WHERE id = ?`).run(...values, id)
    
    return this.findById(id)
  }

  delete(id: string): void {
    const db = getDatabase()
    db.prepare('DELETE FROM overlays WHERE id = ?').run(id)
  }
}
