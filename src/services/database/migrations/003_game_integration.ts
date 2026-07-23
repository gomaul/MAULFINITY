import Database from 'better-sqlite3'

/**
 * Migration 003 - Game Integration Framework
 * 
 * Creates tables for:
 * - games: Registered games
 * - game_settings: Game-specific settings
 * - game_sessions: Connection sessions
 * - game_events: Event history
 * - game_commands: Command history
 */
export function migration003(db: Database.Database): void {
  // 1. Games Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL DEFAULT '1.0.0',
      adapter TEXT NOT NULL,
      adapter_version TEXT NOT NULL DEFAULT '1.0.0',
      description TEXT,
      icon TEXT,
      platform TEXT NOT NULL DEFAULT 'pc',
      status TEXT NOT NULL DEFAULT 'installed',
      enabled INTEGER NOT NULL DEFAULT 1,
      settings_json TEXT DEFAULT '{}',
      installed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_used_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 2. Game Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_settings (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      bridge_type TEXT NOT NULL DEFAULT 'websocket',
      bridge_config TEXT NOT NULL DEFAULT '{}',
      auto_connect INTEGER NOT NULL DEFAULT 0,
      reconnect_attempts INTEGER NOT NULL DEFAULT 3,
      reconnect_delay INTEGER NOT NULL DEFAULT 5000,
      permissions TEXT NOT NULL DEFAULT '[]',
      custom_settings TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `)

  // 3. Game Sessions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      profile_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT,
      duration_ms INTEGER,
      events_count INTEGER DEFAULT 0,
      commands_count INTEGER DEFAULT 0,
      error_count INTEGER DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `)

  // 4. Game Events Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_events (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      raw_data TEXT,
      normalized_data TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `)

  // 5. Game Commands Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_commands (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      action TEXT NOT NULL,
      params TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      result TEXT,
      error TEXT,
      duration_ms INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `)

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
    CREATE INDEX IF NOT EXISTS idx_games_adapter ON games(adapter);
    CREATE INDEX IF NOT EXISTS idx_game_settings_game_id ON game_settings(game_id);
    CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON game_sessions(game_id);
    CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_game_events_session_id ON game_events(session_id);
    CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
    CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_game_commands_session_id ON game_commands(session_id);
    CREATE INDEX IF NOT EXISTS idx_game_commands_game_id ON game_commands(game_id);
    CREATE INDEX IF NOT EXISTS idx_game_commands_status ON game_commands(status);
  `)

  console.log('Migration 003_game_integration completed - game tables created')
}
