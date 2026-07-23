import { IpcMainInvokeEvent } from 'electron'
import { getDatabase } from '@services/database'
import { Logger } from '@services/logger'

const logger = new Logger('SettingsIPC')

export const settingsHandlers = {
  async get(_event: IpcMainInvokeEvent, key: string): Promise<string | null> {
    const db = getDatabase()
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value ?? null
  },

  async set(_event: IpcMainInvokeEvent, key: string, value: string): Promise<void> {
    const db = getDatabase()
    db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value)
    logger.info(`Setting updated: ${key}`)
  },

  async getAll(): Promise<Record<string, string>> {
    const db = getDatabase()
    const rows = db.prepare('SELECT key, value FROM app_settings').all() as { key: string; value: string }[]
    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.key] = row.value
    }
    return settings
  }
}
