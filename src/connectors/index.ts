export { BaseConnector, ConnectorConfig, ConnectorStats } from './core/BaseConnector'
export { ConnectionState, ConnectionStateType } from './core/ConnectionState'
export { EventAdapter, PlatformEvent } from './core/EventAdapter'
export { ConnectorRegistry, ConnectorMetadata, ConnectorConstructor } from './core/ConnectorRegistry'
export { ConnectorFactory } from './core/ConnectorFactory'
export { ConnectorManager, PlatformStatusInfo } from './core/ConnectorManager'

export { TikTokConnector } from './tiktok/TikTokConnector'
export { TikTokConfig, DEFAULT_TIKTOK_CONFIG } from './tiktok/TikTokConfig'
export { TikTokParser, ParsedTikTokEvent } from './tiktok/TikTokParser'

export { YouTubeConnector } from './youtube/YouTubeConnector'
export { YouTubeConfig, DEFAULT_YOUTUBE_CONFIG } from './youtube/YouTubeConfig'
export { YouTubeParser, ParsedYouTubeEvent } from './youtube/YouTubeParser'
