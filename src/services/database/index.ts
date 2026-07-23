import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { runMigrations } from './migrations'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export async function initializeDatabase(): Promise<void> {
  const dbPath = join(app.getPath('userData'), 'database.db')
  db = new Database(dbPath)

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Run migrations
  runMigrations(db)

  console.log('Database initialized at:', dbPath)
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
