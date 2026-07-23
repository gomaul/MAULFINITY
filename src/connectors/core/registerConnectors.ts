import { ConnectorRegistry } from './ConnectorRegistry'
import { TikTokConnector } from '../tiktok/TikTokConnector'
import { YouTubeConnector } from '../youtube/YouTubeConnector'
import { Logger } from '@services/logger'

const logger = new Logger('ConnectorRegistration')

/**
 * Register all built-in connectors to the ConnectorRegistry.
 * Called once during ApplicationCore startup.
 */
export function registerConnectors(): void {
  const registry = ConnectorRegistry.getInstance()

  // Register TikTok Connector
  registry.register('tiktok', TikTokConnector, {
    name: 'TikTok LIVE',
    platform: 'tiktok',
    version: '1.0.0',
    description: 'Connect to TikTok LIVE streams for gifts, comments, follows, and more',
    configFields: ['username', 'autoReconnect', 'reconnectAttempts', 'reconnectDelay']
  })

  // Register YouTube Connector
  registry.register('youtube', YouTubeConnector, {
    name: 'YouTube Live Chat',
    platform: 'youtube',
    version: '1.0.0',
    description: 'Connect to YouTube Live Chat for super chats, memberships, and comments',
    configFields: ['apiKey', 'channelId', 'streamId', 'autoReconnect']
  })

  logger.info(`Registered ${registry.size} connectors: ${registry.getPlatforms().join(', ')}`)
}
