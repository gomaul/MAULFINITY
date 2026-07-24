import { EventBus } from '@core/event-bus/EventBus'
import { ActionEngine } from '@core/action-engine/ActionEngine'
import { Logger } from '@services/logger'
import {
  PluginSDK,
  PluginInfo,
  EventAPI,
  ActionAPI,
  GraphAPI,
  ConnectorAPI,
  GameAPI,
  OverlayAPI,
  StorageAPI,
  UIAPI,
  LoggerAPI,
  EventCallback,
  ActionDefinition,
  NodeDefinition,
  ConnectorDefinition,
  GameAdapterDefinition,
  WidgetDefinition,
  MenuItem,
  Notification,
  PluginPermission
} from '../types'
import { PluginStorage } from '../PluginStorage'
import { PluginPermissionManager } from '../PluginPermissionManager'
import { Plugin } from '../types'
import { MaulfinityEvent } from '@shared/types'

const logger = new Logger('PluginSDK')

/**
 * Concrete PluginSDK implementation that delegates to real core systems
 */
export class PluginSDKImpl implements PluginSDK {
  plugin: PluginInfo
  events: EventAPI
  actions: ActionAPI
  graph: GraphAPI
  connectors: ConnectorAPI
  games: GameAPI
  overlay: OverlayAPI
  storage: StorageAPI
  ui: UIAPI
  logger: LoggerAPI

  constructor(
    private pluginInstance: Plugin,
    private storage: PluginStorage
  ) {
    this.plugin = new PluginInfoImpl(pluginInstance)
    this.events = new EventAPIImpl(pluginInstance)
    this.actions = new ActionAPIImpl(pluginInstance)
    this.graph = new GraphAPIImpl(pluginInstance)
    this.connectors = new ConnectorAPIImpl(pluginInstance)
    this.games = new GameAPIImpl(pluginInstance)
    this.overlay = new OverlayAPIImpl(pluginInstance)
    this.storage = new StorageAPIImpl(pluginInstance, storage)
    this.ui = new UIAPIImpl(pluginInstance)
    this.logger = new LoggerAPIImpl(pluginInstance)
  }
}

/**
 * PluginInfo implementation
 */
class PluginInfoImpl implements PluginInfo {
  constructor(private plugin: Plugin) {}

  get id(): string { return this.plugin.manifest.id }
  get name(): string { return this.plugin.manifest.name }
  get version(): string { return this.plugin.manifest.version }

  getConfig(): Record<string, unknown> {
    return { ...this.plugin.config }
  }
}

/**
 * EventAPI implementation - delegates to EventBus
 */
class EventAPIImpl implements EventAPI {
  private eventBus = EventBus.getInstance()

  constructor(private plugin: Plugin) {}

  on(eventType: string, callback: EventCallback): () => void {
    this.checkPermission('events.read')
    return this.eventBus.on(eventType, (event) => callback(event), this.plugin.manifest.id)
  }

  once(eventType: string, callback: EventCallback): () => void {
    this.checkPermission('events.read')
    return this.eventBus.once(eventType, (event) => callback(event), this.plugin.manifest.id)
  }

  async emit(event: Omit<MaulfinityEvent, 'id' | 'timestamp'>): Promise<void> {
    this.checkPermission('events.write')
    await this.eventBus.emit({
      id: `plugin_${this.plugin.manifest.id}_${Date.now()}`,
      timestamp: Date.now(),
      ...event
    } as MaulfinityEvent)
  }

  getHistory(limit?: number): MaulfinityEvent[] {
    this.checkPermission('events.read')
    return this.eventBus.getHistory(limit)
  }

  private checkPermission(permission: string): void {
    if (!this.plugin.grantedPermissions.includes(permission as PluginPermission)) {
      throw new Error(`Permission denied: ${permission}`)
    }
  }
}

/**
 * ActionAPI implementation - delegates to ActionEngine
 */
class ActionAPIImpl implements ActionAPI {
  private actionEngine = ActionEngine.getInstance()
  private registeredActions: Map<string, ActionDefinition> = new Map()

  constructor(private plugin: Plugin) {}

  register(type: string, action: ActionDefinition): void {
    this.checkPermission('actions.create')
    
    const prefixedType = `plugin:${this.plugin.manifest.id}:${type}`
    this.registeredActions.set(prefixedType, action)
    
    // Register with ActionEngine
    this.actionEngine.registerAction(prefixedType, {
      name: action.name,
      validate: action.validate,
      execute: action.execute,
      settings: () => ({})
    })
    
    logger.info(`[${this.plugin.manifest.id}] Registered action: ${prefixedType}`)
  }

  unregister(type: string): void {
    const prefixedType = `plugin:${this.plugin.manifest.id}:${type}`
    this.registeredActions.delete(prefixedType)
    logger.info(`[${this.plugin.manifest.id}] Unregistered action: ${prefixedType}`)
  }

  async execute(type: string, config: Record<string, unknown>): Promise<void> {
    this.checkPermission('actions.execute')
    const prefixedType = type.startsWith('plugin:') ? type : `plugin:${this.plugin.manifest.id}:${type}`
    await this.actionEngine.execute(prefixedType, config, {} as MaulfinityEvent)
  }

  getRegistered(): string[] {
    return Array.from(this.registeredActions.keys())
  }

  private checkPermission(permission: string): void {
    if (!this.plugin.grantedPermissions.includes(permission as PluginPermission)) {
      throw new Error(`Permission denied: ${permission}`)
    }
  }
}

/**
 * GraphAPI implementation
 */
class GraphAPIImpl implements GraphAPI {
  private registeredNodes: Map<string, NodeDefinition> = new Map()

  constructor(private plugin: Plugin) {}

  registerNode(node: NodeDefinition): void {
    this.checkPermission('graph.register-node')
    const prefixedType = `plugin:${this.plugin.manifest.id}:${node.type}`
    this.registeredNodes.set(prefixedType, { ...node, type: prefixedType })
    logger.info(`[${this.plugin.manifest.id}] Registered node: ${prefixedType}`)
  }

  unregisterNode(type: string): void {
    const prefixedType = `plugin:${this.plugin.manifest.id}:${type}`
    this.registeredNodes.delete(prefixedType)
    logger.info(`[${this.plugin.manifest.id}] Unregistered node: ${prefixedType}`)
  }

  getRegisteredNodes(): NodeDefinition[] {
    return Array.from(this.registeredNodes.values())
  }

  private checkPermission(permission: string): void {
    if (!this.plugin.grantedPermissions.includes(permission as PluginPermission)) {
      throw new Error(`Permission denied: ${permission}`)
    }
  }
}

/**
 * ConnectorAPI implementation
 */
class ConnectorAPIImpl implements ConnectorAPI {
  private registeredConnectors: Map<string, ConnectorDefinition> = new Map()

  constructor(private plugin: Plugin) {}

  register(connector: ConnectorDefinition): void {
    this.checkPermission('connector.register')
    this.registeredConnectors.set(connector.platform, connector)
    logger.info(`[${this.plugin.manifest.id}] Registered connector: ${connector.platform}`)
  }

  unregister(platform: string): void {
    this.registeredConnectors.delete(platform)
    logger.info(`[${this.plugin.manifest.id}] Unregistered connector: ${platform}`)
  }

  getStatus(platform: string): string {
    return this.registeredConnectors.has(platform) ? 'registered' : 'not_found'
  }

  private checkPermission(permission: string): void {
    if (!this.plugin.grantedPermissions.includes(permission as PluginPermission)) {
      throw new Error(`Permission denied: ${permission}`)
    }
  }
}

/**
 * GameAPI implementation
 */
class GameAPIImpl implements GameAPI {
  private registeredAdapters: Map<string, GameAdapterDefinition> = new Map()

  constructor(private plugin: Plugin) {}

  registerAdapter(adapter: GameAdapterDefinition): void {
    this.checkPermission('game.register-adapter')
    this.registeredAdapters.set(adapter.gameId, adapter)
    logger.info(`[${this.plugin.manifest.id}] Registered game adapter: ${adapter.gameId}`)
  }

  unregisterAdapter(gameId: string): void {
    this.registeredAdapters.delete(gameId)
    logger.info(`[${this.plugin.manifest.id}] Unregistered game adapter: ${gameId}`)
  }

  private checkPermission(permission: string): void {
    if (!this.plugin.grantedPermissions.includes(permission as PluginPermission)) {
      throw new Error(`Permission denied: ${permission}`)
    }
  }
}

/**
 * OverlayAPI implementation
 */
class OverlayAPIImpl implements OverlayAPI {
  private registeredWidgets: Map<string, WidgetDefinition> = new Map()

  constructor(private plugin: Plugin) {}

  registerWidget(widget: WidgetDefinition): void {
    this.checkPermission('overlay.create')
    const prefixedType = `plugin:${this.plugin.manifest.id}:${widget.type}`
    this.registeredWidgets.set(prefixedType, { ...widget, type: prefixedType })
    logger.info(`[${this.plugin.manifest.id}] Registered widget: ${prefixedType}`)
  }

  unregisterWidget(type: string): void {
    const prefixedType = `plugin:${this.plugin.manifest.id}:${type}`
    this.registeredWidgets.delete(prefixedType)
    logger.info(`[${this.plugin.manifest.id}] Unregistered widget: ${prefixedType}`)
  }

  getRegisteredWidgets(): WidgetDefinition[] {
    return Array.from(this.registeredWidgets.values())
  }

  private checkPermission(permission: string): void {
    if (!this.plugin.grantedPermissions.includes(permission as PluginPermission)) {
      throw new Error(`Permission denied: ${permission}`)
    }
  }
}

/**
 * StorageAPI implementation
 */
class StorageAPIImpl implements StorageAPI {
  constructor(
    private plugin: Plugin,
    private storage: PluginStorage
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.storage.get(this.plugin.manifest.id, key)
    return value as T | undefined
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.storage.set(this.plugin.manifest.id, key, value)
  }

  async delete(key: string): Promise<void> {
    await this.storage.delete(this.plugin.manifest.id, key)
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.plugin.manifest.id)
  }

  async keys(): Promise<string[]> {
    return this.storage.keys(this.plugin.manifest.id)
  }
}

/**
 * UIAPI implementation
 */
class UIAPIImpl implements UIAPI {
  private menuItems: Map<string, MenuItem> = new Map()

  constructor(private plugin: Plugin) {}

  addMenuItem(item: MenuItem): void {
    this.checkPermission('ui.add-menu')
    const prefixedId = `plugin:${this.plugin.manifest.id}:${item.id}`
    this.menuItems.set(prefixedId, { ...item, id: prefixedId })
    logger.info(`[${this.plugin.manifest.id}] Added menu item: ${item.label}`)
  }

  removeMenuItem(id: string): void {
    const prefixedId = `plugin:${this.plugin.manifest.id}:${id}`
    this.menuItems.delete(prefixedId)
    logger.info(`[${this.plugin.manifest.id}] Removed menu item: ${id}`)
  }

  notify(notification: Notification): void {
    this.checkPermission('ui.notify')
    logger.info(`[${this.plugin.manifest.id}] Notification: ${notification.title} - ${notification.message}`)
  }

  private checkPermission(permission: string): void {
    if (!this.plugin.grantedPermissions.includes(permission as PluginPermission)) {
      throw new Error(`Permission denied: ${permission}`)
    }
  }
}

/**
 * LoggerAPI implementation
 */
class LoggerAPIImpl implements LoggerAPI {
  constructor(private plugin: Plugin) {}

  debug(message: string, ...args: unknown[]): void {
    logger.debug(`[${this.plugin.manifest.id}] ${message}`, ...args)
  }

  info(message: string, ...args: unknown[]): void {
    logger.info(`[${this.plugin.manifest.id}] ${message}`, ...args)
  }

  warning(message: string, ...args: unknown[]): void {
    logger.warning(`[${this.plugin.manifest.id}] ${message}`, ...args)
  }

  error(message: string, error?: Error): void {
    logger.error(`[${this.plugin.manifest.id}] ${message}`, error)
  }
}
