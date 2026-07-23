import { initializeDatabase, closeDatabase } from '@services/database'
import { Logger } from '@services/logger'
import { EventBus } from '@core/event-bus/EventBus'
import { ServiceContainer } from '@core/service-container/ServiceContainer'
import { ModuleManager } from '@core/module-manager/ModuleManager'
import { ConfigManager } from '@core/config-manager/ConfigManager'
import { TriggerEngine } from '@core/trigger-engine/TriggerEngine'
import { ActionEngine } from '@core/action-engine/ActionEngine'
import { ConnectorManager } from '@connectors/core/ConnectorManager'
import { registerConnectors } from '@connectors/core/registerConnectors'

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
  private connectorManager!: ConnectorManager

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
      this.connectorManager = ConnectorManager.getInstance()

      this.serviceContainer.registerInstance('triggerEngine', this.triggerEngine)
      this.serviceContainer.registerInstance('actionEngine', this.actionEngine)
      this.serviceContainer.registerInstance('connectorManager', this.connectorManager)

      this.logger.info('Core engines initialized')

      // Step 5.5: Register built-in connectors (TikTok, YouTube)
      registerConnectors()

      // Step 5.6: Load triggers into TriggerEngine
      await this.loadTriggersIntoEngine()

      // Step 6: Initialize all registered services
      await this.serviceContainer.initializeAll()

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

      // Step 3: Disconnect all connectors
      if (this.connectorManager) {
        await this.connectorManager.disconnectAll()
        this.logger.info('All connectors disconnected')
      }

      // Step 4: Clear event bus
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
   * Get the connector manager instance
   */
  getConnectorManager(): ConnectorManager {
    return this.connectorManager
  }
}
