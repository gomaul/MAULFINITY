import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { app } from 'electron'
import { Logger } from '@services/logger'

const logger = new Logger('ConfigManager')

export interface AppConfig {
  // General
  language: string
  theme: 'dark' | 'light'
  autoUpdate: boolean
  startMinimized: boolean

  // OBS Settings
  obsHost: string
  obsPort: number
  obsPassword: string

  // TTS Settings
  ttsEnabled: boolean
  ttsVoice: string
  ttsLanguage: string

  // Audio Settings
  masterVolume: number
  soundEnabled: boolean

  // Connection Settings
  autoConnect: boolean
  reconnectAttempts: number
  reconnectDelay: number

  // Storage
  storagePath: string

  // Developer
  devMode: boolean
  debugLogging: boolean
}

export type ConfigKey = keyof AppConfig
export type ConfigChangeEvent = {
  key: ConfigKey
  oldValue: unknown
  newValue: unknown
}

type ConfigChangeCallback = (event: ConfigChangeEvent) => void

const defaultConfig: AppConfig = {
  language: 'en',
  theme: 'dark',
  autoUpdate: true,
  startMinimized: false,
  obsHost: 'localhost',
  obsPort: 4455,
  obsPassword: '',
  ttsEnabled: false,
  ttsVoice: 'default',
  ttsLanguage: 'en',
  masterVolume: 100,
  soundEnabled: true,
  autoConnect: false,
  reconnectAttempts: 3,
  reconnectDelay: 5000,
  storagePath: 'default',
  devMode: false,
  debugLogging: false
}

/**
 * ConfigManager - Persistent Configuration Manager
 *
 * Manages application configuration with:
 * - File-based persistence (config.json)
 * - Default values
 * - Change notifications
 * - Partial updates
 * - Reset capability
 *
 * Usage:
 *   const config = ConfigManager.getInstance()
 *   await config.load()
 *   config.set('theme', 'light')
 *   await config.save()
 */
export class ConfigManager {
  private static instance: ConfigManager
  private config: AppConfig
  private configPath: string
  private changeListeners: ConfigChangeCallback[] = []
  private loaded = false

  private constructor() {
    this.config = { ...defaultConfig }
    this.configPath = join(app.getPath('userData'), 'config.json')
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  /**
   * Load configuration from file
   */
  async load(): Promise<void> {
    try {
      if (existsSync(this.configPath)) {
        const raw = readFileSync(this.configPath, 'utf-8')
        const saved = JSON.parse(raw)

        // Merge with defaults to ensure all keys exist
        this.config = { ...defaultConfig, ...saved }
        logger.info('Configuration loaded from file')
      } else {
        // First run - create default config
        this.config = { ...defaultConfig }
        await this.save()
        logger.info('Default configuration created')
      }
      this.loaded = true
    } catch (error) {
      logger.error('Failed to load configuration, using defaults', error as Error)
      this.config = { ...defaultConfig }
      this.loaded = true
    }
  }

  /**
   * Save configuration to file
   */
  async save(): Promise<void> {
    try {
      const dir = dirname(this.configPath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8')
      logger.info('Configuration saved')
    } catch (error) {
      logger.error('Failed to save configuration', error as Error)
    }
  }

  /**
   * Get a config value
   */
  get<K extends ConfigKey>(key: K): AppConfig[K] {
    return this.config[key]
  }

  /**
   * Get all config
   */
  getAll(): AppConfig {
    return { ...this.config }
  }

  /**
   * Set a config value (does not auto-save)
   */
  set<K extends ConfigKey>(key: K, value: AppConfig[K]): void {
    const oldValue = this.config[key]
    if (oldValue === value) return

    this.config[key] = value
    logger.debug(`Config updated: ${key}`)

    // Notify listeners
    this.notifyChange(key, oldValue, value)
  }

  /**
   * Set multiple config values at once
   */
  setMany(updates: Partial<AppConfig>): void {
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        this.set(key as ConfigKey, value)
      }
    }
  }

  /**
   * Reset a specific key to default
   */
  resetKey<K extends ConfigKey>(key: K): void {
    const oldValue = this.config[key]
    const newValue = defaultConfig[key]
    this.config[key] = newValue
    this.notifyChange(key, oldValue, newValue)
    logger.debug(`Config key '${key}' reset to default`)
  }

  /**
   * Reset all config to defaults
   */
  resetAll(): void {
    this.config = { ...defaultConfig }
    logger.info('Configuration reset to defaults')
  }

  /**
   * Subscribe to config changes
   */
  onChange(callback: ConfigChangeCallback): () => void {
    this.changeListeners.push(callback)
    return () => {
      const index = this.changeListeners.indexOf(callback)
      if (index > -1) {
        this.changeListeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify all listeners of a change
   */
  private notifyChange(key: ConfigKey, oldValue: unknown, newValue: unknown): void {
    for (const listener of this.changeListeners) {
      try {
        listener({ key, oldValue, newValue })
      } catch (error) {
        logger.error('Error in config change listener', error as Error)
      }
    }
  }

  /**
   * Check if config has been loaded
   */
  isLoaded(): boolean {
    return this.loaded
  }

  /**
   * Get the config file path
   */
  getConfigPath(): string {
    return this.configPath
  }

  /**
   * Get default config for a key
   */
  getDefault<K extends ConfigKey>(key: K): AppConfig[K] {
    return defaultConfig[key]
  }

  /**
   * Validate config against schema (basic validation)
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (typeof this.config.obsPort !== 'number' || this.config.obsPort < 1 || this.config.obsPort > 65535) {
      errors.push('Invalid OBS port')
    }

    if (typeof this.config.masterVolume !== 'number' || this.config.masterVolume < 0 || this.config.masterVolume > 100) {
      errors.push('Invalid master volume')
    }

    if (typeof this.config.reconnectAttempts !== 'number' || this.config.reconnectAttempts < 0) {
      errors.push('Invalid reconnect attempts')
    }

    return { valid: errors.length === 0, errors }
  }
}
