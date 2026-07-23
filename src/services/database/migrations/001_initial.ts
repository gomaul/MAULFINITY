import Database from 'better-sqlite3'

export function migration001(db: Database.Database): void {
  // 1. Users Table
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      username TEXT,
      email TEXT,
      avatar TEXT,
      license_type TEXT DEFAULT 'personal',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 2. Profiles Table
  db.exec(`
    CREATE TABLE profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      settings_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 3. Connectors Table
  db.exec(`
    CREATE TABLE connectors (
      id TEXT PRIMARY KEY,
      profile_id TEXT,
      platform TEXT NOT NULL,
      username TEXT,
      status TEXT DEFAULT 'disconnected',
      config_json TEXT DEFAULT '{}',
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `)

  // 4. Events Table
  db.exec(`
    CREATE TABLE events (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      event_type TEXT NOT NULL,
      username TEXT,
      payload_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 5. Triggers Table
  db.exec(`
    CREATE TABLE triggers (
      id TEXT PRIMARY KEY,
      profile_id TEXT,
      name TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      event_type TEXT NOT NULL,
      condition_json TEXT DEFAULT '{}',
      actions_json TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `)

  // 6. Actions Table
  db.exec(`
    CREATE TABLE actions (
      id TEXT PRIMARY KEY,
      trigger_id TEXT,
      type TEXT NOT NULL,
      config_json TEXT DEFAULT '{}',
      order_number INTEGER DEFAULT 0,
      FOREIGN KEY (trigger_id) REFERENCES triggers(id) ON DELETE CASCADE
    )
  `)

  // 7. Assets Table
  db.exec(`
    CREATE TABLE assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT,
      path TEXT NOT NULL,
      metadata_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 8. Overlays Table
  db.exec(`
    CREATE TABLE overlays (
      id TEXT PRIMARY KEY,
      profile_id TEXT,
      name TEXT NOT NULL,
      scene_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `)

  // 9. Plugins Table
  db.exec(`
    CREATE TABLE plugins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      permissions_json TEXT DEFAULT '[]',
      path TEXT
    )
  `)

  // 10. Logs Table
  db.exec(`
    CREATE TABLE logs (
      id TEXT PRIMARY KEY,
      level TEXT NOT NULL,
      module TEXT,
      message TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 11. App Settings Table
  db.exec(`
    CREATE TABLE app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT
    )
  `)

  // Insert default settings
  db.prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?)`).run('theme', 'dark')
  db.prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?)`).run('language', 'en')
  db.prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?)`).run('autoUpdate', 'true')

  // Create indexes for performance
  db.exec(`
    CREATE INDEX idx_connectors_profile_id ON connectors(profile_id);
    CREATE INDEX idx_triggers_profile_id ON triggers(profile_id);
    CREATE INDEX idx_actions_trigger_id ON actions(trigger_id);
    CREATE INDEX idx_events_platform ON events(platform);
    CREATE INDEX idx_events_type ON events(event_type);
    CREATE INDEX idx_events_created_at ON events(created_at);
    CREATE INDEX idx_assets_type ON assets(type);
    CREATE INDEX idx_logs_level ON logs(level);
    CREATE INDEX idx_logs_timestamp ON logs(timestamp);
  `)

  console.log('Migration 001_initial completed - All 11 tables created')
}
