import Database from 'better-sqlite3'

export function migration002(db: Database.Database): void {
  // 1. Automations Table
  db.exec(`
    CREATE TABLE automations (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'simple',
      enabled INTEGER NOT NULL DEFAULT 1,
      event_type TEXT NOT NULL,
      conditions_json TEXT DEFAULT '[]',
      actions_json TEXT NOT NULL DEFAULT '[]',
      cooldown INTEGER DEFAULT 0,
      max_executions INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `)

  // 2. Automation History Table
  db.exec(`
    CREATE TABLE automation_history (
      id TEXT PRIMARY KEY,
      automation_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      duration_ms INTEGER,
      action_results TEXT DEFAULT '[]',
      error_message TEXT,
      FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
    )
  `)

  // Create indexes for performance
  db.exec(`
    CREATE INDEX idx_automations_profile_id ON automations(profile_id);
    CREATE INDEX idx_automations_event_type ON automations(event_type);
    CREATE INDEX idx_automations_enabled ON automations(enabled);
    CREATE INDEX idx_automation_history_automation_id ON automation_history(automation_id);
    CREATE INDEX idx_automation_history_status ON automation_history(status);
    CREATE INDEX idx_automation_history_started_at ON automation_history(started_at);
  `)

  console.log('Migration 002_automations completed - automations and automation_history tables created')
}
