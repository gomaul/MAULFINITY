import { getDatabase } from '../index'

export interface Asset {
  id: string
  name: string
  type: string
  path: string
  category: string | null
  created_at: string
}

export class AssetRepository {
  findAll(): Asset[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM assets ORDER BY created_at DESC').all() as Asset[]
  }

  findByType(type: string): Asset[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM assets WHERE type = ? ORDER BY created_at DESC').all(type) as Asset[]
  }

  findById(id: string): Asset | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as Asset | undefined
  }

  create(asset: Asset): Asset {
    const db = getDatabase()
    db.prepare(`
      INSERT INTO assets (id, name, type, path, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(asset.id, asset.name, asset.type, asset.path, asset.category, asset.created_at)
    return asset
  }

  delete(id: string): void {
    const db = getDatabase()
    db.prepare('DELETE FROM assets WHERE id = ?').run(id)
  }
}
