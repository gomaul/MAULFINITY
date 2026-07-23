import { Logger } from '@services/logger'

const logger = new Logger('ModuleManager')

export type ModuleStatus = 'registered' | 'loaded' | 'initialized' | 'running' | 'stopped' | 'error'

export interface Module {
  name: string
  version?: string
  description?: string
  dependencies?: string[]
  initialize(): Promise<void> | void
  destroy(): Promise<void> | void
  start?(): Promise<void> | void
  stop?(): Promise<void> | void
}

interface ModuleRegistration {
  module: Module
  status: ModuleStatus
  error?: Error
}

/**
 * ModuleManager - Dynamic Module Lifecycle Manager
 *
 * Manages the lifecycle of Maulfinity modules:
 * - Registration
 * - Loading
 * - Initialization
 * - Starting
 * - Stopping
 * - Unloading
 *
 * Supports dependency resolution and error recovery.
 *
 * Usage:
 *   const manager = ModuleManager.getInstance()
 *   manager.register(tiktokModule)
 *   await manager.initializeAll()
 *   await manager.startAll()
 */
export class ModuleManager {
  private static instance: ModuleManager
  private modules: Map<string, ModuleRegistration> = new Map()
  private initializationOrder: string[] = []

  private constructor() {}

  static getInstance(): ModuleManager {
    if (!ModuleManager.instance) {
      ModuleManager.instance = new ModuleManager()
    }
    return ModuleManager.instance
  }

  /**
   * Register a module
   */
  register(module: Module): void {
    if (this.modules.has(module.name)) {
      logger.warning(`Module '${module.name}' is already registered, overwriting`)
    }

    this.modules.set(module.name, {
      module,
      status: 'registered'
    })

    logger.info(`Module '${module.name}' registered`)
  }

  /**
   * Unregister a module
   */
  unregister(name: string): void {
    const registration = this.modules.get(name)
    if (registration) {
      if (registration.status === 'running' || registration.status === 'initialized') {
        logger.warning(`Module '${name}' is still active, stopping before unregister`)
      }
      this.modules.delete(name)
      logger.info(`Module '${name}' unregistered`)
    }
  }

  /**
   * Get module status
   */
  getStatus(name: string): ModuleStatus | undefined {
    return this.modules.get(name)?.status
  }

  /**
   * Get all module statuses
   */
  getAllStatuses(): Record<string, ModuleStatus> {
    const statuses: Record<string, ModuleStatus> = {}
    for (const [name, registration] of this.modules) {
      statuses[name] = registration.status
    }
    return statuses
  }

  /**
   * Check if a module is registered
   */
  has(name: string): boolean {
    return this.modules.has(name)
  }

  /**
   * Get all registered module names
   */
  getModuleNames(): string[] {
    return Array.from(this.modules.keys())
  }

  /**
   * Resolve initialization order based on dependencies
   */
  private resolveInitializationOrder(): string[] {
    const order: string[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (name: string) => {
      if (visited.has(name)) return
      if (visiting.has(name)) {
        logger.error(`Circular dependency detected: ${name}`)
        return
      }

      visiting.add(name)

      const registration = this.modules.get(name)
      if (registration?.module.dependencies) {
        for (const dep of registration.module.dependencies) {
          if (this.modules.has(dep)) {
            visit(dep)
          }
        }
      }

      visiting.delete(name)
      visited.add(name)
      order.push(name)
    }

    for (const name of this.modules.keys()) {
      visit(name)
    }

    return order
  }

  /**
   * Initialize all modules in dependency order
   */
  async initializeAll(): Promise<void> {
    logger.info('Initializing all modules...')

    this.initializationOrder = this.resolveInitializationOrder()

    for (const name of this.initializationOrder) {
      await this.initializeModule(name)
    }

    logger.info(`All modules initialized: ${this.initializationOrder.join(', ')}`)
  }

  /**
   * Initialize a single module
   */
  async initializeModule(name: string): Promise<void> {
    const registration = this.modules.get(name)
    if (!registration) {
      logger.error(`Module '${name}' not found`)
      return
    }

    if (registration.status === 'initialized' || registration.status === 'running') {
      logger.debug(`Module '${name}' already initialized`)
      return
    }

    try {
      logger.info(`Initializing module '${name}'...`)
      registration.status = 'loaded'
      await registration.module.initialize()
      registration.status = 'initialized'
      logger.info(`Module '${name}' initialized successfully`)
    } catch (error) {
      registration.status = 'error'
      registration.error = error as Error
      logger.error(`Failed to initialize module '${name}'`, error as Error)
      throw error
    }
  }

  /**
   * Start all initialized modules
   */
  async startAll(): Promise<void> {
    logger.info('Starting all modules...')

    for (const name of this.initializationOrder) {
      await this.startModule(name)
    }

    logger.info('All modules started')
  }

  /**
   * Start a single module
   */
  async startModule(name: string): Promise<void> {
    const registration = this.modules.get(name)
    if (!registration) {
      logger.error(`Module '${name}' not found`)
      return
    }

    if (registration.status !== 'initialized') {
      logger.warning(`Module '${name}' cannot be started (status: ${registration.status})`)
      return
    }

    try {
      if (registration.module.start) {
        logger.info(`Starting module '${name}'...`)
        await registration.module.start()
      }
      registration.status = 'running'
      logger.info(`Module '${name}' started`)
    } catch (error) {
      registration.status = 'error'
      registration.error = error as Error
      logger.error(`Failed to start module '${name}'`, error as Error)
    }
  }

  /**
   * Stop all running modules (reverse order)
   */
  async stopAll(): Promise<void> {
    logger.info('Stopping all modules...')

    const reverseOrder = [...this.initializationOrder].reverse()

    for (const name of reverseOrder) {
      await this.stopModule(name)
    }

    logger.info('All modules stopped')
  }

  /**
   * Stop a single module
   */
  async stopModule(name: string): Promise<void> {
    const registration = this.modules.get(name)
    if (!registration) {
      logger.error(`Module '${name}' not found`)
      return
    }

    if (registration.status !== 'running') {
      logger.debug(`Module '${name}' is not running (status: ${registration.status})`)
      return
    }

    try {
      if (registration.module.stop) {
        logger.info(`Stopping module '${name}'...`)
        await registration.module.stop()
      }
      registration.status = 'stopped'
      logger.info(`Module '${name}' stopped`)
    } catch (error) {
      registration.status = 'error'
      registration.error = error as Error
      logger.error(`Failed to stop module '${name}'`, error as Error)
    }
  }

  /**
   * Destroy all modules (reverse order)
   */
  async destroyAll(): Promise<void> {
    logger.info('Destroying all modules...')

    const reverseOrder = [...this.initializationOrder].reverse()

    for (const name of reverseOrder) {
      await this.destroyModule(name)
    }

    this.modules.clear()
    logger.info('All modules destroyed')
  }

  /**
   * Destroy a single module
   */
  async destroyModule(name: string): Promise<void> {
    const registration = this.modules.get(name)
    if (!registration) {
      logger.error(`Module '${name}' not found`)
      return
    }

    try {
      if (registration.status === 'running') {
        await this.stopModule(name)
      }

      logger.info(`Destroying module '${name}'...`)
      await registration.module.destroy()
      registration.status = 'stopped'
      logger.info(`Module '${name}' destroyed`)
    } catch (error) {
      registration.status = 'error'
      registration.error = error as Error
      logger.error(`Failed to destroy module '${name}'`, error as Error)
    }
  }

  /**
   * Get module error if any
   */
  getModuleError(name: string): Error | undefined {
    return this.modules.get(name)?.error
  }

  /**
   * Get count of modules in each status
   */
  getStats(): Record<ModuleStatus, number> {
    const stats: Record<ModuleStatus, number> = {
      registered: 0,
      loaded: 0,
      initialized: 0,
      running: 0,
      stopped: 0,
      error: 0
    }

    for (const registration of this.modules.values()) {
      stats[registration.status]++
    }

    return stats
  }
}
