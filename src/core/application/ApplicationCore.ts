import { initializeDatabase, closeDatabase } from '@services/database'
import { Logger } from '@services/logger'
import { EventBus } from '@core/event-bus/EventBus'
import { ServiceContainer } from '@core/service-container/ServiceContainer'
import { ModuleManager } from '@core/module-manager/ModuleManager'
import { ConfigManager } from '@core/config-manager/ConfigManager'
import { TriggerEngine } from '@core/trigger-engine/TriggerEngine'
import { ActionEngine } from '@core/action-engine/ActionEngine'
import { AutomationEngine } from '@core/automation/AutomationEngine'
import { ConnectorManager } from '@connectors/core/ConnectorManager'
import { registerConnectors } from '@connectors/core/registerConnectors'
import { GameManager } from '@game/GameManager'
import { GTAAdapter } from '@game/adapters/GTAAdapter'
import { RobloxAdapter } from '@game/adapters/RobloxAdapter'
import { CustomAdapter } from '@game/adapters/CustomAdapter'
import { PluginManager } from '@plugins/PluginManager'

export type ApplicationStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error'

export class ApplicationCore {
  private static instance: ApplicationCore
  private status: ApplicationStatus = 'idle'
  private logger: Logger
  private startTime: number = 0

  private eventBus!: EventBus
  private serviceContainer!: ServiceContainer
  private moduleManager!: ModuleManager
  private configManager!: ConfigManager
  private triggerEngine!: TriggerEngine
  private actionEngine!: ActionEngine
  private automationEngine!: AutomationEngine
  private connectorManager!: ConnectorManager
  private gameManager!: GameManager
  private pluginManager!: PluginManager

  private constructor() {
    this.logger = new Logger('ApplicationCore')
  }

  static getInstance(): ApplicationCore {
    if (!ApplicationCore.instance) {
      ApplicationCore.instance = new ApplicationCore()
    }
    return ApplicationCore.instance
  }

  /**
   * Start the application
   * Flow: Load Config → Initialize DB → Init Event Bus → Init Modules → Start Modules → Ready
   */
  async start(): Promise<void> {
    if (this.status === 'running') {
      this.logger.warning('Application is already running')
      return
    }

    if (this.status === 'starting') {
      this.logger.warning('Application is already starting')
      return
    }

    this.status = 'starting'
    this.startTime = Date.now()
    this.logger.info('Starting Maulfinity Application Core...')

    try {
      // Step 1: Initialize core singletons
      this.serviceContainer = ServiceContainer.getInstance()
      this.configManager = ConfigManager.getInstance()
      this.moduleManager = ModuleManager.getInstance()
      this.eventBus = EventBus.getInstance()

      this.logger.info('Core singletons initialized')

      // Step 2: Load configuration
      await this.configManager.load()
      this.logger.info('Configuration loaded')

      // Register config in service container
      this.serviceContainer.registerInstance('config', this.configManager)

      // Step 3: Initialize database
      await initializeDatabase()
      this.logger.info('Database initialized')

      // Register database in service container
      this.serviceContainer.registerInstance('database', { initialized: true })

      // Step 4: Register core services in service container
      this.serviceContainer.registerInstance('eventBus', this.eventBus)
      this.serviceContainer.registerInstance('moduleManager', this.moduleManager)

      // Step 5: Initialize engines
      this.actionEngine = ActionEngine.getInstance()
      this.triggerEngine = new TriggerEngine()
      this.automationEngine = AutomationEngine.getInstance()
      this.connectorManager = ConnectorManager.getInstance()

      this.serviceContainer.registerInstance('triggerEngine', this.triggerEngine)
      this.serviceContainer.registerInstance('actionEngine', this.actionEngine)
      this.serviceContainer.registerInstance('automationEngine', this.automationEngine)
      this.serviceContainer.registerInstance('connectorManager', this.connectorManager)

      this.logger.info('Core engines initialized')

      // Step 5.5: Register built-in connectors (TikTok, YouTube)
      registerConnectors()

      // Step 5.6: Initialize Game Integration Layer
      this.gameManager = GameManager.getInstance()
      this.gameManager.registerAdapterFactory('GTAAdapter', GTAAdapter)
      this.gameManager.registerAdapterFactory('RobloxAdapter', RobloxAdapter)
      this.gameManager.registerAdapterFactory('CustomAdapter', CustomAdapter)
      this.serviceContainer.registerInstance('gameManager', this.gameManager)
      this.logger.info('Game Integration Layer initialized')

      // Step 5.7: Initialize Plugin System
      this.pluginManager = PluginManager.getInstance()
      await this.pluginManager.initialize()
      this.serviceContainer.registerInstance('pluginManager', this.pluginManager)
      this.logger.info('Plugin System initialized')

      // Step 5.8: Load triggers into TriggerEngine
      await this.loadTriggersIntoEngine()

      // Step 5.9: Initialize AutomationEngine
      this.automationEngine.initialize()
      await this.loadAutomationsIntoEngine()

      // Step 5.10: Load games from database
      await this.loadGamesIntoManager()

      // Step 5.11: Load plugins from database
      await this.pluginManager.loadFromDatabase()

      // Step 6: Initialize all registered services
      await this.serviceContainer.initializeAll()

      // Step 6.1: Auto-connect enabled games
      await this.autoConnectGames()

      this.status = 'running'

      const elapsed = Date.now() - this.startTime
      this.logger.info(`Application Core started successfully in ${elapsed}ms`)
    } catch (error) {
      this.status = 'error'
      this.logger.critical('Failed to start Application Core', error as Error)
      throw error
    }
  }

  /**
   * Shutdown the application
   * Flow: Stop Modules → Close DB → Clear Event Bus → Stop
   */
  async shutdown(): Promise<void> {
    if (this.status !== 'running' && this.status !== 'error') {
      this.logger.warning(`Cannot shutdown: status is ${this.status}`)
      return
    }

    if (this.status === 'stopping') {
      this.logger.warning('Shutdown already in progress')
      return
    }

    this.status = 'stopping'
    this.logger.info('Shutting down Application Core...')

    try {
      // Step 1: Stop all modules
      await this.moduleManager.stopAll()
      this.logger.info('All modules stopped')

      // Step 2: Destroy all modules
      await this.moduleManager.destroyAll()
      this.logger.info('All modules destroyed')

      // Step 3.5: Shutdown plugin system
      if (this.pluginManager) {
        await this.pluginManager.shutdown()
        this.logger.info('Plugin system shutdown')
      }

      // Step 3.6: Shutdown automation engine
      if (this.automationEngine) {
        this.automationEngine.shutdown()
        this.logger.info('Automation engine shutdown')
      }

      // Step 4: Disconnect all connectors
      if (this.connectorManager) {
        await this.connectorManager.disconnectAll()
        this.logger.info('All connectors disconnected')
      }

      // Step 5: Clear event bus
      this.eventBus.clear()
      this.logger.info('Event bus cleared')

      // Step 4: Clear service container
      this.serviceContainer.clear()
      this.logger.info('Service container cleared')

      // Step 5: Close database
      closeDatabase()
      this.logger.info('Database closed')

      this.status = 'stopped'
      this.logger.info('Application Core shutdown complete')
    } catch (error) {
      this.logger.error('Error during shutdown', error as Error)
      this.status = 'stopped'
    }
  }

  /**
   * Get application status
   */
  getStatus(): ApplicationStatus {
    return this.status
  }

  /**
   * Get detailed status information
   */
  getDetailedStatus(): {
    status: ApplicationStatus
    uptime: number
    moduleStats: ReturnType<ModuleManager['getStats']>
    eventBusStats: ReturnType<EventBus['getStats']>
    serviceCount: number
  } {
    const defaultStats: ReturnType<ModuleManager['getStats']> = {
      registered: 0,
      loaded: 0,
      initialized: 0,
      running: 0,
      stopped: 0,
      error: 0
    }
    const defaultEventStats = { totalEvents: 0, eventsByType: {} as Record<string, number>, listenerCount: 0, lastEventTimestamp: null }
    return {
      status: this.status,
      uptime: this.status === 'running' ? Date.now() - this.startTime : 0,
      moduleStats: this.moduleManager?.getStats() ?? defaultStats,
      eventBusStats: this.eventBus?.getStats() ?? defaultEventStats,
      serviceCount: this.serviceContainer?.size ?? 0
    }
  }

  /**
   * Load automations from database into AutomationEngine
   */
  private async loadAutomationsIntoEngine(): Promise<void> {
    try {
      const { AutomationRepository } = await import('@services/database/repositories/AutomationRepository')
      const automationRepo = new AutomationRepository()
      const rows = automationRepo.findAll()

      const automations = rows.map(row => ({
        id: row.id,
        profileId: row.profile_id,
        name: row.name,
        description: row.description || undefined,
        type: row.type as 'simple' | 'advanced',
        enabled: row.enabled === 1,
        eventType: row.event_type,
        conditions: JSON.parse(row.conditions_json || '[]'),
        actions: JSON.parse(row.actions_json || '[]'),
        cooldown: row.cooldown || undefined,
        maxExecutions: row.max_executions || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))

      this.automationEngine.loadAutomations(automations)
      this.logger.info(`Loaded ${automations.length} automations into AutomationEngine`)
    } catch (error) {
      this.logger.error('Failed to load automations', error as Error)
    }
  }

  /**
   * Check if the application is running
   */
  isRunning(): boolean {
    return this.status === 'running'
  }

  /**
   * Get the event bus instance
   */
  getEventBus(): EventBus {
    return this.eventBus
  }

  /**
   * Get the service container instance
   */
  getServiceContainer(): ServiceContainer {
    return this.serviceContainer
  }

  /**
   * Get the module manager instance
   */
  getModuleManager(): ModuleManager {
    return this.moduleManager
  }

  /**
   * Get the config manager instance
   */
  getConfigManager(): ConfigManager {
    return this.configManager
  }

  /**
   * Get the trigger engine instance
   */
  getTriggerEngine(): TriggerEngine {
    return this.triggerEngine
  }

  /**
   * Get the action engine instance
   */
  getActionEngine(): ActionEngine {
    return this.actionEngine
  }

  /**
   * Get the automation engine instance
   */
  getAutomationEngine(): AutomationEngine {
    return this.automationEngine
  }

  /**
   * Get the connector manager instance
   */
  getConnectorManager(): ConnectorManager {
    return this.connectorManager
  }

  /**
   * Get the game manager instance
   */
  getGameManager(): GameManager {
    return this.gameManager
  }

  /**
   * Load games from database into GameManager
   */
  private async loadGamesIntoManager(): Promise<void> {
    try {
      const { GameRepository } = await import('@services/database/repositories/GameRepository')
      const gameRepo = new GameRepository()
      const rows = gameRepo.findAll()

      const games = rows.map(row => ({
        id: row.id,
        name: row.name,
        version: row.version,
        description: row.description || '',
        adapter: row.adapter,
        adapterVersion: row.adapter_version,
        status: row.status as import('@game/types').GameStatus,
        config: JSON.parse(row.settings_json || '{}'),
        installedAt: row.installed_at,
        lastUsed: row.last_used_at || undefined
      }))

      this.gameManager.loadGames(games)
      this.logger.info(`Loaded ${games.length} games into GameManager`)
    } catch (error) {
      this.logger.error('Failed to load games', error as Error)
    }
  }

  /**
   * Auto-connect enabled games
   */
  private async autoConnectGames(): Promise<void> {
    try {
      const games = this.gameManager.getRegistry().getAllGames()
      const autoConnectGames = games.filter(g => g.config.autoConnect && g.status !== 'disabled')

      for (const game of autoConnectGames) {
        try {
          await this.gameManager.connectGame(game.id)
          this.logger.info(`Auto-connected to game: ${game.name}`)
        } catch (error) {
          this.logger.warning(`Failed to auto-connect to game: ${game.name}`)
        }
      }
    } catch (error) {
      this.logger.error('Failed to auto-connect games', error as Error)
    }
  }
}
