import { Logger } from '@services/logger'
import { Plugin, PluginManifest, PluginState, PluginPermission } from './types'

const logger = new Logger('PluginRegistry')

/**
 * PluginRegistry - Tracks all loaded plugins
 * 
 * Similar to ConnectorRegistry but for plugins.
 * Provides fast lookup and state management.
 */
export class PluginRegistry {
  private static instance: PluginRegistry
  private plugins: Map<string, Plugin> = new Map()

  private constructor() {}

  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry()
    }
    return PluginRegistry.instance
  }

  /**
   * Register a plugin
   */
  register(manifest: PluginManifest, path: string): Plugin {
    const plugin: Plugin = {
      manifest,
      state: 'installed',
      config: {},
      grantedPermissions: [],
      installedAt: new Date().toISOString(),
      path
    }

    this.plugins.set(manifest.id, plugin)
    logger.info(`Plugin registered: ${manifest.name} v${manifest.version}`)
    return plugin
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): boolean {
    const existed = this.plugins.delete(pluginId)
    if (existed) {
      logger.info(`Plugin unregistered: ${pluginId}`)
    }
    return existed
  }

  /**
   * Get a plugin
   */
  get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * Get all plugins
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get plugins by state
   */
  getByState(state: PluginState): Plugin[] {
    return this.getAll().filter(p => p.state === state)
  }

  /**
   * Get plugins by type
   */
  getByType(type: string): Plugin[] {
    return this.getAll().filter(p => p.manifest.type === type)
  }

  /**
   * Get enabled plugins
   */
  getEnabled(): Plugin[] {
    return this.getByState('enabled').concat(this.getByState('active'))
  }

  /**
   * Check if plugin exists
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  /**
   * Get all plugin IDs
   */
  getIds(): string[] {
    return Array.from(this.plugins.keys())
  }

  /**
   * Update plugin state
   */
  setState(pluginId: string, state: PluginState): boolean {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return false

    plugin.state = state
    logger.debug(`[${pluginId}] State: ${state}`)
    return true
  }

  /**
   * Update plugin config
   */
  setConfig(pluginId: string, config: Record<string, unknown>): boolean {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return false

    plugin.config = config
    return true
  }

  /**
   * Set granted permissions
   */
  setPermissions(pluginId: string, permissions: PluginPermission[]): boolean {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return false

    plugin.grantedPermissions = permissions
    return true
  }

  /**
   * Set plugin error
   */
  setError(pluginId: string, error: string): boolean {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return false

    plugin.state = 'error'
    plugin.error = error
    return true
  }

  /**
   * Clear error
   */
  clearError(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return false

    plugin.error = undefined
    return true
  }

  /**
   * Get number of plugins
   */
  get size(): number {
    return this.plugins.size
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear()
    logger.info('Plugin registry cleared')
  }
}
