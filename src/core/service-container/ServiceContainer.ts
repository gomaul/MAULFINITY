import { Logger } from '@services/logger'

const logger = new Logger('ServiceContainer')

export interface ServiceOptions {
  singleton?: boolean
}

export type ServiceFactory<T = unknown> = () => T | Promise<T>

interface ServiceRegistration<T = unknown> {
  factory: ServiceFactory<T>
  instance?: T
  options: ServiceOptions
}

/**
 * ServiceContainer - Dependency Injection Container
 *
 * Manages service registration, resolution, and lifecycle.
 * Supports both singleton and transient service lifetimes.
 *
 * Usage:
 *   const container = ServiceContainer.getInstance()
 *   container.register('logger', () => new Logger(), { singleton: true })
 *   const logger = container.resolve<Logger>('logger')
 */
export class ServiceContainer {
  private static instance: ServiceContainer
  private services: Map<string, ServiceRegistration> = new Map()
  private initialized = false

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer()
    }
    return ServiceContainer.instance
  }

  /**
   * Register a service with a factory function
   */
  register<T>(name: string, factory: ServiceFactory<T>, options: ServiceOptions = {}): void {
    if (this.services.has(name)) {
      logger.warning(`Service '${name}' is already registered, overwriting`)
    }

    this.services.set(name, {
      factory,
      options: { singleton: true, ...options }
    })

    logger.debug(`Service '${name}' registered`)
  }

  /**
   * Register an existing instance as a singleton service
   */
  registerInstance<T>(name: string, instance: T): void {
    this.services.set(name, {
      factory: () => instance,
      instance,
      options: { singleton: true }
    })

    logger.debug(`Service instance '${name}' registered`)
  }

  /**
   * Resolve a service by name
   */
  async resolve<T = unknown>(name: string): Promise<T> {
    const registration = this.services.get(name)

    if (!registration) {
      throw new Error(`Service '${name}' is not registered`)
    }

    // Return existing singleton instance
    if (registration.options.singleton && registration.instance !== undefined) {
      return registration.instance as T
    }

    // Create new instance
    const instance = await registration.factory()

    // Cache singleton instances
    if (registration.options.singleton) {
      registration.instance = instance
    }

    return instance as T
  }

  /**
   * Resolve a service synchronously (only works for already-resolved singletons)
   */
  resolveSync<T = unknown>(name: string): T {
    const registration = this.services.get(name)

    if (!registration) {
      throw new Error(`Service '${name}' is not registered`)
    }

    if (registration.instance === undefined) {
      throw new Error(`Service '${name}' has not been initialized yet. Use resolve() instead.`)
    }

    return registration.instance as T
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name)
  }

  /**
   * Check if a service has been resolved (has an instance)
   */
  isResolved(name: string): boolean {
    const registration = this.services.get(name)
    return registration?.instance !== undefined
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys())
  }

  /**
   * Initialize all registered singleton services
   */
  async initializeAll(): Promise<void> {
    if (this.initialized) {
      logger.warning('ServiceContainer already initialized')
      return
    }

    logger.info('Initializing all services...')

    for (const [name, registration] of this.services) {
      if (registration.options.singleton && registration.instance === undefined) {
        try {
          const instance = await registration.factory()
          registration.instance = instance
          logger.debug(`Service '${name}' initialized`)
        } catch (error) {
          logger.error(`Failed to initialize service '${name}'`, error as Error)
          throw error
        }
      }
    }

    this.initialized = true
    logger.info('All services initialized')
  }

  /**
   * Clear all registrations and instances
   */
  clear(): void {
    this.services.clear()
    this.initialized = false
    logger.info('ServiceContainer cleared')
  }

  /**
   * Get the number of registered services
   */
  get size(): number {
    return this.services.size
  }
}
