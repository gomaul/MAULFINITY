import { ConnectorRegistry } from './ConnectorRegistry'
import { ConnectorConfig } from './BaseConnector'
import { Logger } from '@services/logger'

const logger = new Logger('ConnectorFactory')

/**
 * ConnectorFactory - Creates connector instances
 *
 * Uses ConnectorRegistry to instantiate the correct connector class.
 * Provides a clean factory pattern for creating connectors.
 *
 * Usage:
 *   const factory = ConnectorFactory.getInstance()
 *   const tiktok = factory.create('tiktok', { platform: 'tiktok', username: 'gomaul' })
 */
export class ConnectorFactory {
  private static instance: ConnectorFactory
  private registry: ConnectorRegistry

  private constructor() {
    this.registry = ConnectorRegistry.getInstance()
  }

  static getInstance(): ConnectorFactory {
    if (!ConnectorFactory.instance) {
      ConnectorFactory.instance = new ConnectorFactory()
    }
    return ConnectorFactory.instance
  }

  /**
   * Create a connector instance by platform name
   */
  create<T = unknown>(platform: string, config: ConnectorConfig): T | undefined {
    if (!this.registry.has(platform)) {
      logger.error(`No connector registered for platform: ${platform}`)
      return undefined
    }

    const connector = this.registry.create(platform, config)
    if (!connector) {
      logger.error(`Failed to create connector for platform: ${platform}`)
      return undefined
    }

    logger.info(`Connector created: ${platform}`)
    return connector as T
  }

  /**
   * Create multiple connectors at once
   */
  createMany(
    configs: ConnectorConfig[]
  ): Map<string, unknown> {
    const connectors = new Map<string, unknown>()

    for (const config of configs) {
      const connector = this.create(config.platform, config)
      if (connector) {
        connectors.set(config.platform, connector)
      }
    }

    return connectors
  }

  /**
   * Check if a connector can be created for the given platform
   */
  canCreate(platform: string): boolean {
    return this.registry.has(platform)
  }

  /**
   * Get all available platform names
   */
  getAvailablePlatforms(): string[] {
    return this.registry.getPlatforms()
  }
}
