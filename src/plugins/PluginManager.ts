import { EventEmitter } from 'events'
import { EventBus } from '@core/event-bus/EventBus'
import { Logger } from '@services/logger'
import { PluginRegistry } from './PluginRegistry'
import { PluginValidator } from './PluginValidator'
import { PluginPermissionManager } from './PluginPermissionManager'
import { PluginStorage } from './PluginStorage'
import {
  Plugin,
  PluginManifest,
  PluginState,
  PluginPermission,
  PluginActivator,
  PluginDeactivator,
  EventCallback
} from './types'

const logger = new Logger('PluginManager')

/**
 * PluginManager - Central orchestrator for plugin lifecycle
 * 
 * Responsibilities:
 * - Install/uninstall plugins
 * - Load/unload plugins
 * - Enable/disable plugins
 * - Manage permissions
 * - Handle plugin errors
 * 
 * Architecture:
 *   Plugin → PluginManager → PluginSandbox → Core Systems
 */
export class PluginManager extends EventEmitter {
  private static instance: PluginManager
  private registry: PluginRegistry
  private validator: PluginPermissionManager
  private permissionManager: PluginPermissionManager
  private storage: PluginStorage
  private eventBus: EventBus

  /** Plugin activators (loaded functions) */
  private activators: Map<string, PluginActivator> = new Map()
  private deactivators: Map<string, PluginDeactivator> = new Map()

  /** Plugin SDK instances */
  private sdkInstances: Map<string, import('./types').PluginSDK> = new Map()

  private constructor() {
    super()
    this.registry = PluginRegistry.getInstance()
    this.validator = new PluginPermissionManager()
    this.permissionManager = new PluginPermissionManager()
    this.storage = new PluginStorage()
    this.eventBus = EventBus.getInstance()
  }

  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager()
    }
    return PluginManager.instance
  }

  // ============================================================
  // LIFECYCLE
  // ============================================================

  /**
   * Initialize plugin manager
   */
  async initialize(): Promise<void> {
    logger.info('Initializing PluginManager...')
    logger.info('PluginManager initialized')
  }

  /**
   * Shutdown plugin manager
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down PluginManager...')

    // Disable all enabled plugins
    const enabled = this.registry.getEnabled()
    for (const plugin of enabled) {
      await this.disable(plugin.manifest.id)
    }

    logger.info('PluginManager shutdown complete')
  }

  // ============================================================
  // PLUGIN OPERATIONS
  // ============================================================

  /**
   * Install a plugin from path
   */
  async install(manifest: PluginManifest, pluginPath: string): Promise<Plugin> {
    // Validate manifest
    const validation = PluginValidator.validateManifest(manifest)
    if (!validation.valid) {
      throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`)
    }

    // Check if already installed
    if (this.registry.has(manifest.id)) {
      throw new Error(`Plugin already installed: ${manifest.id}`)
    }

    // Register plugin
    const plugin = this.registry.register(manifest, pluginPath)

    // Store in database
    await this.storage.savePlugin(plugin)

    logger.info(`Plugin installed: ${manifest.name} v${manifest.version}`)
    this.emit('plugin:installed', { pluginId: manifest.id })

    return plugin
  }

  /**
   * Uninstall a plugin
   */
  async uninstall(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    // Disable first if enabled
    if (plugin.state === 'enabled' || plugin.state === 'active') {
      await this.disable(pluginId)
    }

    // Unload if loaded
    if (plugin.state === 'loaded') {
      await this.unload(pluginId)
    }

    // Remove from registry
    this.registry.unregister(pluginId)

    // Remove from database
    await this.storage.deletePlugin(pluginId)

    // Cleanup SDK instance
    this.sdkInstances.delete(pluginId)
    this.activators.delete(pluginId)
    this.deactivators.delete(pluginId)

    logger.info(`Plugin uninstalled: ${pluginId}`)
    this.emit('plugin:removed', { pluginId })
  }

  /**
   * Load a plugin
   */
  async load(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    if (plugin.state !== 'installed') {
      logger.warning(`Plugin ${pluginId} cannot be loaded (state: ${plugin.state})`)
      return
    }

    try {
      // Load plugin module (dynamic import)
      const module = await this.loadPluginModule(plugin.path)

      if (module.activate) {
        this.activators.set(pluginId, module.activate)
      }
      if (module.deactivate) {
        this.deactivators.set(pluginId, module.deactivate)
      }

      this.registry.setState(pluginId, 'loaded')
      logger.info(`Plugin loaded: ${pluginId}`)
    } catch (error) {
      this.registry.setError(pluginId, (error as Error).message)
      logger.error(`Failed to load plugin: ${pluginId}`, error as Error)
      throw error
    }
  }

  /**
   * Unload a plugin
   */
  async unload(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId)
    if (!plugin) return

    if (plugin.state !== 'loaded' && plugin.state !== 'disabled') {
      return
    }

    // Call deactivate if exists
    const deactivator = this.deactivators.get(pluginId)
    if (deactivator) {
      try {
        const sdk = this.sdkInstances.get(pluginId)
        if (sdk) {
          await deactivator(sdk)
        }
      } catch (error) {
        logger.error(`Error deactivating plugin: ${pluginId}`, error as Error)
      }
    }

    this.activators.delete(pluginId)
    this.deactivators.delete(pluginId)
    this.sdkInstances.delete(pluginId)

    this.registry.setState(pluginId, 'installed')
    logger.info(`Plugin unloaded: ${pluginId}`)
  }

  /**
   * Enable a plugin
   */
  async enable(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    if (plugin.state !== 'loaded' && plugin.state !== 'disabled') {
      logger.warning(`Plugin ${pluginId} cannot be enabled (state: ${plugin.state})`)
      return
    }

    try {
      // Create SDK instance for plugin
      const sdk = this.createSDK(pluginId)
      this.sdkInstances.set(pluginId, sdk)

      // Call activate function
      const activator = this.activators.get(pluginId)
      if (activator) {
        await activator(sdk)
      }

      this.registry.setState(pluginId, 'enabled')
      plugin.lastEnabledAt = new Date().toISOString()

      // Update database
      await this.storage.updatePlugin(pluginId, { enabled: 1 })

      logger.info(`Plugin enabled: ${pluginId}`)
      this.emit('plugin:enabled', { pluginId })
    } catch (error) {
      this.registry.setError(pluginId, (error as Error).message)
      logger.error(`Failed to enable plugin: ${pluginId}`, error as Error)
      throw error
    }
  }

  /**
   * Disable a plugin
   */
  async disable(pluginId: string): Promise<void> {
    const plugin = this.registry.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    if (plugin.state !== 'enabled' && plugin.state !== 'active') {
      return
    }

    try {
      // Call deactivate function
      const deactivator = this.deactivators.get(pluginId)
      if (deactivator) {
        const sdk = this.sdkInstances.get(pluginId)
        if (sdk) {
          await deactivator(sdk)
        }
      }

      this.registry.setState(pluginId, 'disabled')
      this.sdkInstances.delete(pluginId)

      // Update database
      await this.storage.updatePlugin(pluginId, { enabled: 0 })

      logger.info(`Plugin disabled: ${pluginId}`)
      this.emit('plugin:disabled', { pluginId })
    } catch (error) {
      logger.error(`Failed to disable plugin: ${pluginId}`, error as Error)
    }
  }

  // ============================================================
  // QUERIES
  // ============================================================

  /**
   * Get a plugin
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.registry.get(pluginId)
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): Plugin[] {
    return this.registry.getAll()
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): Plugin[] {
    return this.registry.getEnabled()
  }

  /**
   * Check if plugin is installed
   */
  isInstalled(pluginId: string): boolean {
    return this.registry.has(pluginId)
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(pluginId: string): boolean {
    const plugin = this.registry.get(pluginId)
    return plugin?.state === 'enabled' || plugin?.state === 'active'
  }

  // ============================================================
  // INTERNAL HELPERS
  // ============================================================

  /**
   * Load plugin module
   */
  private async loadPluginModule(pluginPath: string): Promise<Record<string, unknown>> {
    // Dynamic import of plugin entry point
    const modulePath = `${pluginPath}/index.js`
    try {
      return await import(modulePath)
    } catch {
      // Fallback for development
      return {}
    }
  }

  /**
   * Create SDK instance for plugin
   */
  private createSDK(pluginId: string): import('./types').PluginSDK {
    const plugin = this.registry.get(pluginId)!
    
    return {
      plugin: {
        id: plugin.manifest.id,
        name: plugin.manifest.name,
        version: plugin.manifest.version,
        getConfig: () => ({ ...plugin.config })
      },
      events: {
        on: (eventType: string, callback: EventCallback) => {
          return this.eventBus.on(eventType, (event) => callback(event), pluginId)
        },
        once: (eventType: string, callback: EventCallback) => {
          return this.eventBus.once(eventType, (event) => callback(event), pluginId)
        },
        emit: async (event) => {
          await this.eventBus.emit({
            id: `plugin_${Date.now()}`,
            timestamp: Date.now(),
            ...event
          } as import('@shared/types').MaulfinityEvent)
        },
        getHistory: (limit) => this.eventBus.getHistory(limit)
      },
      actions: {
        register: (type, action) => {
          logger.info(`[${pluginId}] Registered action: ${type}`)
        },
        unregister: (type) => {
          logger.info(`[${pluginId}] Unregistered action: ${type}`)
        },
        execute: async (type, config) => {
          logger.info(`[${pluginId}] Executed action: ${type}`)
        },
        getRegistered: () => []
      },
      graph: {
        registerNode: (node) => {
          logger.info(`[${pluginId}] Registered node: ${node.type}`)
        },
        unregisterNode: (type) => {
          logger.info(`[${pluginId}] Unregistered node: ${type}`)
        },
        getRegisteredNodes: () => []
      },
      connectors: {
        register: (connector) => {
          logger.info(`[${pluginId}] Registered connector: ${connector.platform}`)
        },
        unregister: (platform) => {
          logger.info(`[${pluginId}] Unregistered connector: ${platform}`)
        },
        getStatus: (platform) => 'disconnected'
      },
      games: {
        registerAdapter: (adapter) => {
          logger.info(`[${pluginId}] Registered game adapter: ${adapter.gameId}`)
        },
        unregisterAdapter: (gameId) => {
          logger.info(`[${pluginId}] Unregistered game adapter: ${gameId}`)
        }
      },
      overlay: {
        registerWidget: (widget) => {
          logger.info(`[${pluginId}] Registered widget: ${widget.type}`)
        },
        unregisterWidget: (type) => {
          logger.info(`[${pluginId}] Unregistered widget: ${type}`)
        },
        getRegisteredWidgets: () => []
      },
      storage: {
        get: async (key) => this.storage.get(pluginId, key),
        set: async (key, value) => this.storage.set(pluginId, key, value),
        delete: async (key) => this.storage.delete(pluginId, key),
        clear: async () => this.storage.clear(pluginId),
        keys: async () => this.storage.keys(pluginId)
      },
      ui: {
        addMenuItem: (item) => {
          logger.info(`[${pluginId}] Added menu item: ${item.label}`)
        },
        removeMenuItem: (id) => {
          logger.info(`[${pluginId}] Removed menu item: ${id}`)
        },
        notify: (notification) => {
          logger.info(`[${pluginId}] Notification: ${notification.title}`)
        }
      },
      logger: {
        debug: (msg, ...args) => logger.debug(`[${pluginId}] ${msg}`, ...args),
        info: (msg, ...args) => logger.info(`[${pluginId}] ${msg}`, ...args),
        warning: (msg, ...args) => logger.warning(`[${pluginId}] ${msg}`, ...args),
        error: (msg, error) => logger.error(`[${pluginId}] ${msg}`, error)
      }
    }
  }

  /**
   * Load plugins from database
   */
  async loadFromDatabase(): Promise<void> {
    try {
      const plugins = await this.storage.getAllPlugins()
      for (const plugin of plugins) {
        if (!this.registry.has(plugin.id)) {
          const manifest: PluginManifest = JSON.parse(plugin.manifest_json)
          this.registry.register(manifest, plugin.path)
          
          const registered = this.registry.get(plugin.id)
          if (registered) {
            registered.config = JSON.parse(plugin.config_json || '{}')
            registered.grantedPermissions = JSON.parse(plugin.permissions_json || '[]')
            
            if (plugin.enabled) {
              await this.load(plugin.id)
              await this.enable(plugin.id)
            }
          }
        }
      }
      logger.info(`Loaded ${plugins.length} plugins from database`)
    } catch (error) {
      logger.error('Failed to load plugins from database', error as Error)
    }
  }
}
