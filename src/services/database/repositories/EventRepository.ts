import { getDatabase } from '../index'

export interface Event {
  id: string
  platform: string
  type: string
  username: string | null
  payload: string | null
  timestamp: string
}

export class EventRepository {
  findAll(limit: number = 100): Event[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT ?').all(limit) as Event[]
  }

  findByPlatform(platform: string, limit: number = 100): Event[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM events WHERE platform = ? ORDER BY timestamp DESC LIMIT ?').all(platform, limit) as Event[]
  }

  create(event: Event): Event {
    const db = getDatabase()
    db.prepare(`
      INSERT INTO events (id, platform, type, username, payload, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(event.id, event.platform, event.type, event.username, event.payload, event.timestamp)
    return event
  }

  clear(): void {
    const db = getDatabase()
    db.prepare('DELETE FROM events').run()
  }
}
