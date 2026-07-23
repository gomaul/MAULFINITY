import Database from 'better-sqlite3'

/**
 * Migration 004 - Plugin SDK
 * 
 * Creates tables for:
 * - plugins: Installed plugins
 * - plugin_settings: Plugin configuration
 * - plugin_storage: Plugin data storage
 */
export function migration004(db: Database.Database): void {
  // 1. Plugins Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      description TEXT,
      author TEXT,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'installed',
      enabled INTEGER NOT NULL DEFAULT 0,
      entry_point TEXT NOT NULL DEFAULT 'index.js',
      manifest_json TEXT NOT NULL DEFAULT '{}',
      permissions_json TEXT NOT NULL DEFAULT '[]',
      config_json TEXT NOT NULL DEFAULT '{}',
      path TEXT NOT NULL,
      installed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_enabled_at TEXT,
      error_count INTEGER DEFAULT 0,
      last_error TEXT
    )
  `)

  // 2. Plugin Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_settings (
      id TEXT PRIMARY KEY,
      plugin_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
      UNIQUE(plugin_id, key)
    )
  `)

  // 3. Plugin Storage Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_storage (
      id TEXT PRIMARY KEY,
      plugin_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
      UNIQUE(plugin_id, key)
    )
  `)

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_plugins_status ON plugins(status);
    CREATE INDEX IF NOT EXISTS idx_plugins_type ON plugins(type);
    CREATE INDEX IF NOT EXISTS idx_plugins_enabled ON plugins(enabled);
    CREATE INDEX IF NOT EXISTS idx_plugin_settings_plugin_id ON plugin_settings(plugin_id);
    CREATE INDEX IF NOT EXISTS idx_plugin_storage_plugin_id ON plugin_storage(plugin_id);
  `)

  console.log('Migration 004_plugin_sdk completed - plugin tables created')
}
