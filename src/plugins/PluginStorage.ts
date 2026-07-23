import { getDatabase } from '@services/database'
import { v4 as uuidv4 } from 'uuid'
import { Plugin, PluginRow } from './types'

/**
 * PluginStorage - Handles plugin data persistence
 */
export class PluginStorage {
  /**
   * Save plugin to database
   */
  async savePlugin(plugin: Plugin): Promise<void> {
    const db = getDatabase()
    const id = plugin.manifest.id

    db.prepare(`
      INSERT OR REPLACE INTO plugins 
      (id, name, version, description, author, type, status, enabled, entry_point, manifest_json, permissions_json, config_json, path, installed_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      plugin.manifest.name,
      plugin.manifest.version,
      plugin.manifest.description,
      plugin.manifest.author,
      plugin.manifest.type,
      plugin.state,
      0,
      plugin.manifest.entry,
      JSON.stringify(plugin.manifest),
      JSON.stringify(plugin.grantedPermissions),
      JSON.stringify(plugin.config),
      plugin.path,
      plugin.installedAt,
      new Date().toISOString()
    )
  }

  /**
   * Get all plugins from database
   */
  async getAllPlugins(): Promise<PluginRow[]> {
    const db = getDatabase()
    return db.prepare('SELECT * FROM plugins ORDER BY name').all() as PluginRow[]
  }

  /**
   * Get plugin by ID
   */
  async getPlugin(pluginId: string): Promise<PluginRow | undefined> {
    const db = getDatabase()
    return db.prepare('SELECT * FROM plugins WHERE id = ?').get(pluginId) as PluginRow | undefined
  }

  /**
   * Update plugin
   */
  async updatePlugin(pluginId: string, data: Partial<PluginRow>): Promise<void> {
    const db = getDatabase()
    const fields: string[] = []
    const values: unknown[] = []

    for (const [key, value] of Object.entries(data)) {
      if (key === 'id') continue
      fields.push(`${key} = ?`)
      values.push(value)
    }

    if (fields.length === 0) return

    fields.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(pluginId)

    db.prepare(`
      UPDATE plugins SET ${fields.join(', ')} WHERE id = ?
    `).run(...values)
  }

  /**
   * Delete plugin from database
   */
  async deletePlugin(pluginId: string): Promise<void> {
    const db = getDatabase()
    db.prepare('DELETE FROM plugins WHERE id = ?').run(pluginId)
    db.prepare('DELETE FROM plugin_settings WHERE plugin_id = ?').run(pluginId)
    db.prepare('DELETE FROM plugin_storage WHERE plugin_id = ?').run(pluginId)
  }

  /**
   * Get plugin setting
   */
  async getSetting(pluginId: string, key: string): Promise<unknown> {
    const db = getDatabase()
    const row = db.prepare(
      'SELECT value FROM plugin_settings WHERE plugin_id = ? AND key = ?'
    ).get(pluginId, key) as { value: string } | undefined

    if (!row) return undefined
    try {
      return JSON.parse(row.value)
    } catch {
      return row.value
    }
  }

  /**
   * Set plugin setting
   */
  async setSetting(pluginId: string, key: string, value: unknown): Promise<void> {
    const db = getDatabase()
    const id = uuidv4()
    const serialized = JSON.stringify(value)

    db.prepare(`
      INSERT OR REPLACE INTO plugin_settings (id, plugin_id, key, value, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, pluginId, key, serialized, new Date().toISOString())
  }

  /**
   * Delete plugin setting
   */
  async deleteSetting(pluginId: string, key: string): Promise<void> {
    const db = getDatabase()
    db.prepare('DELETE FROM plugin_settings WHERE plugin_id = ? AND key = ?').run(pluginId, key)
  }

  /**
   * Get all settings for a plugin
   */
  async getAllSettings(pluginId: string): Promise<Record<string, unknown>> {
    const db = getDatabase()
    const rows = db.prepare(
      'SELECT key, value FROM plugin_settings WHERE plugin_id = ?'
    ).all(pluginId) as Array<{ key: string; value: string }>

    const settings: Record<string, unknown> = {}
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value)
      } catch {
        settings[row.key] = row.value
      }
    }
    return settings
  }

  /**
   * Get plugin storage value
   */
  async get(pluginId: string, key: string): Promise<unknown> {
    const db = getDatabase()
    const row = db.prepare(
      'SELECT value FROM plugin_storage WHERE plugin_id = ? AND key = ?'
    ).get(pluginId, key) as { value: string } | undefined

    if (!row) return undefined
    try {
      return JSON.parse(row.value)
    } catch {
      return row.value
    }
  }

  /**
   * Set plugin storage value
   */
  async set(pluginId: string, key: string, value: unknown): Promise<void> {
    const db = getDatabase()
    const id = uuidv4()
    const serialized = JSON.stringify(value)

    db.prepare(`
      INSERT OR REPLACE INTO plugin_storage (id, plugin_id, key, value, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, pluginId, key, serialized, new Date().toISOString())
  }

  /**
   * Delete plugin storage value
   */
  async delete(pluginId: string, key: string): Promise<void> {
    const db = getDatabase()
    db.prepare('DELETE FROM plugin_storage WHERE plugin_id = ? AND key = ?').run(pluginId, key)
  }

  /**
   * Clear all storage for a plugin
   */
  async clear(pluginId: string): Promise<void> {
    const db = getDatabase()
    db.prepare('DELETE FROM plugin_storage WHERE plugin_id = ?').run(pluginId)
  }

  /**
   * Get all keys for a plugin
   */
  async keys(pluginId: string): Promise<string[]> {
    const db = getDatabase()
    const rows = db.prepare(
      'SELECT key FROM plugin_storage WHERE plugin_id = ?'
    ).all(pluginId) as Array<{ key: string }>

    return rows.map(r => r.key)
  }
}
