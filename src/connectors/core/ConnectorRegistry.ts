import { Logger } from '@services/logger'
import { ConnectorConfig } from './BaseConnector'

const logger = new Logger('ConnectorRegistry')

/**
 * Connector class constructor type
 */
export type ConnectorConstructor<T extends { platform: string } = { platform: string }> = new (
  config: ConnectorConfig
) => T

/**
 * Connector metadata
 */
export interface ConnectorMetadata {
  name: string
  platform: string
  version: string
  description: string
  configFields: string[]
}

/**
 * ConnectorRegistry - Stores and manages available connector types
 *
 * Allows dynamic registration of connectors (including from plugins).
 * Think of it as a catalog of available connectors.
 *
 * Usage:
 *   const registry = ConnectorRegistry.getInstance()
 *   registry.register('tiktok', TikTokConnector, metadata)
 *   registry.register('youtube', YouTubeConnector, metadata)
 *   const ConnectorClass = registry.get('tiktok')
 */
export class ConnectorRegistry {
  private static instance: ConnectorRegistry
  private connectors: Map<string, {
    constructor: ConnectorConstructor
    metadata: ConnectorMetadata
  }> = new Map()

  private constructor() {}

  static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry()
    }
    return ConnectorRegistry.instance
  }

  /**
   * Register a connector type
   */
  register(
    platform: string,
    connectorClass: ConnectorConstructor,
    metadata: ConnectorMetadata
  ): void {
    if (this.connectors.has(platform)) {
      logger.warning(`Connector '${platform}' is already registered, overwriting`)
    }

    this.connectors.set(platform, {
      constructor: connectorClass,
      metadata
    })

    logger.info(`Connector registered: ${platform} v${metadata.version}`)
  }

  /**
   * Unregister a connector type
   */
  unregister(platform: string): boolean {
    const existed = this.connectors.delete(platform)
    if (existed) {
      logger.info(`Connector unregistered: ${platform}`)
    }
    return existed
  }

  /**
   * Get a connector constructor by platform
   */
  get(platform: string): ConnectorConstructor | undefined {
    return this.connectors.get(platform)?.constructor
  }

  /**
   * Get connector metadata
   */
  getMetadata(platform: string): ConnectorMetadata | undefined {
    return this.connectors.get(platform)?.metadata
  }

  /**
   * Create a new connector instance
   */
  create(platform: string, config: ConnectorConfig): InstanceType<ConnectorConstructor> | undefined {
    const registration = this.connectors.get(platform)
    if (!registration) {
      logger.error(`Connector not found: ${platform}`)
      return undefined
    }

    try {
      const instance = new registration.constructor(config)
      logger.debug(`Connector instance created: ${platform}`)
      return instance as InstanceType<ConnectorConstructor>
    } catch (error) {
      logger.error(`Failed to create connector: ${platform}`, error as Error)
      return undefined
    }
  }

  /**
   * Check if a connector is registered
   */
  has(platform: string): boolean {
    return this.connectors.has(platform)
  }

  /**
   * Get all registered platform names
   */
  getPlatforms(): string[] {
    return Array.from(this.connectors.keys())
  }

  /**
   * Get all registered connector metadata
   */
  getAllMetadata(): ConnectorMetadata[] {
    return Array.from(this.connectors.values()).map(reg => reg.metadata)
  }

  /**
   * Get number of registered connectors
   */
  get size(): number {
    return this.connectors.size
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.connectors.clear()
    logger.info('Connector registry cleared')
  }
}
