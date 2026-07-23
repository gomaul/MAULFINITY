import Database from 'better-sqlite3'
import { migration001 } from './001_initial'
import { migration002 } from './002_automations'

export function runMigrations(db: Database.Database): void {
  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Get applied migrations
  const applied = db.prepare('SELECT name FROM migrations').all() as { name: string }[]
  const appliedNames = new Set(applied.map(m => m.name))

  // Run pending migrations
  const migrations = [
    { name: '001_initial', fn: migration001 },
    { name: '002_automations', fn: migration002 }
  ]

  for (const migration of migrations) {
    if (!appliedNames.has(migration.name)) {
      console.log(`Running migration: ${migration.name}`)
      migration.fn(db)
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name)
    }
  }
}
