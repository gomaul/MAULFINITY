import { BaseConnector, ConnectorConfig, ConnectorStats } from './BaseConnector'
import { ConnectorRegistry } from './ConnectorRegistry'
import { ConnectorFactory } from './ConnectorFactory'
import { Logger } from '@services/logger'

const logger = new Logger('ConnectorManager')

/**
 * Platform status info for UI
 */
export interface PlatformStatusInfo {
  platform: string
  connected: boolean
  state: string
  username?: string
  stats: ConnectorStats
}

/**
 * ConnectorManager - Central manager for all connectors
 *
 * This is the "boss" of all connectors. UI and other modules
 * interact with connectors through this manager.
 *
 * Responsibilities:
 * - Manage connector lifecycle (create, start, stop, destroy)
 * - Provide status information for all connectors
 * - Handle bulk operations
 *
 * Usage:
 *   const manager = ConnectorManager.getInstance()
 *   await manager.connect('tiktok', { platform: 'tiktok', username: 'gomaul' })
 *   const status = manager.getStatus('tiktok')
 *   const allStatus = manager.getAllStatus()
 */
export class ConnectorManager {
  private static instance: ConnectorManager
  private connectors: Map<string, BaseConnector> = new Map()
  private registry: ConnectorRegistry
  private factory: ConnectorFactory

  private constructor() {
    this.registry = ConnectorRegistry.getInstance()
    this.factory = ConnectorFactory.getInstance()
  }

  static getInstance(): ConnectorManager {
    if (!ConnectorManager.instance) {
      ConnectorManager.instance = new ConnectorManager()
    }
    return ConnectorManager.instance
  }

  /**
   * Connect to a platform
   * Creates connector if it doesn't exist, then starts it
   */
  async connect(platform: string, config: ConnectorConfig): Promise<boolean> {
    try {
      // Get or create connector
      let connector = this.connectors.get(platform)

      if (!connector) {
        connector = this.createConnector(platform, config)
        if (!connector) {
          return false
        }
      }

      // Start connection
      await connector.start()
      return true
    } catch (error) {
      logger.error(`Failed to connect to ${platform}`, error as Error)
      return false
    }
  }

  /**
   * Disconnect from a platform
   */
  async disconnect(platform: string): Promise<boolean> {
    const connector = this.connectors.get(platform)
    if (!connector) {
      logger.warning(`No connector found for platform: ${platform}`)
      return false
    }

    try {
      await connector.stop()
      return true
    } catch (error) {
      logger.error(`Failed to disconnect from ${platform}`, error as Error)
      return false
    }
  }

  /**
   * Disconnect all platforms
   */
  async disconnectAll(): Promise<void> {
    logger.info('Disconnecting all platforms...')

    const promises = Array.from(this.connectors.keys()).map(platform =>
      this.disconnect(platform)
    )

    await Promise.allSettled(promises)
    logger.info('All platforms disconnected')
  }

  /**
   * Get connection status for a platform
   */
  getStatus(platform: string): PlatformStatusInfo | null {
    const connector = this.connectors.get(platform)
    if (!connector) {
      return null
    }

    return {
      platform,
      connected: connector.isConnected(),
      state: connector.getState(),
      username: connector.getConfig().username,
      stats: connector.getStats()
    }
  }

  /**
   * Get status for all active connectors
   */
  getAllStatus(): PlatformStatusInfo[] {
    return Array.from(this.connectors.values()).map(connector => ({
      platform: connector.getPlatform(),
      connected: connector.isConnected(),
      state: connector.getState(),
      username: connector.getConfig().username,
      stats: connector.getStats()
    }))
  }

  /**
   * Get all available (registered) platforms
   */
  getAvailablePlatforms(): string[] {
    return this.registry.getPlatforms()
  }

  /**
   * Check if a platform is connected
   */
  isConnected(platform: string): boolean {
    const connector = this.connectors.get(platform)
    return connector?.isConnected() ?? false
  }

  /**
   * Get a connector instance (for advanced usage)
   */
  getConnector(platform: string): BaseConnector | undefined {
    return this.connectors.get(platform)
  }

  /**
   * Create a connector without starting it
   */
  private createConnector(platform: string, config: ConnectorConfig): BaseConnector | undefined {
    const connector = this.factory.create(platform, config) as BaseConnector | undefined
    if (!connector) {
      return null
    }

    // Listen for events
    connector.on('connected', () => {
      logger.info(`[${platform}] Connected`)
    })

    connector.on('disconnected', () => {
      logger.info(`[${platform}] Disconnected`)
    })

    connector.on('error', (data: { error: Error }) => {
      logger.error(`[${platform}] Error`, data.error)
    })

    this.connectors.set(platform, connector)
    return connector
  }

  /**
   * Destroy a connector and remove it
   */
  async destroyConnector(platform: string): Promise<void> {
    const connector = this.connectors.get(platform)
    if (connector) {
      await connector.destroy()
      this.connectors.delete(platform)
      logger.info(`Connector destroyed: ${platform}`)
    }
  }

  /**
   * Destroy all connectors
   */
  async destroyAll(): Promise<void> {
    for (const [platform, connector] of this.connectors) {
      await connector.destroy()
      logger.info(`Connector destroyed: ${platform}`)
    }
    this.connectors.clear()
  }

  /**
   * Get total event count across all connectors
   */
  getTotalEvents(): number {
    let total = 0
    for (const connector of this.connectors.values()) {
      total += connector.getStats().eventsEmitted
    }
    return total
  }
}
