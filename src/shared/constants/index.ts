// App info
export const APP_NAME = 'Maulfinity'
export const APP_VERSION = '0.1.0'
export const APP_DESCRIPTION = 'Streaming Automation Platform'

// IPC Channels
export const IPC_CHANNELS = {
  // Profile
  PROFILE_LIST: 'profile:list',
  PROFILE_GET: 'profile:get',
  PROFILE_CREATE: 'profile:create',
  PROFILE_UPDATE: 'profile:update',
  PROFILE_DELETE: 'profile:delete',

  // Trigger
  TRIGGER_LIST: 'trigger:list',
  TRIGGER_CREATE: 'trigger:create',
  TRIGGER_UPDATE: 'trigger:update',
  TRIGGER_DELETE: 'trigger:delete',
  TRIGGER_TEST: 'trigger:test',
  TRIGGER_TOGGLE: 'trigger:toggle',

  // Asset
  ASSET_LIST: 'asset:list',
  ASSET_IMPORT: 'asset:import',
  ASSET_DELETE: 'asset:delete',
  ASSET_SCAN: 'asset:scan',

  // Connector
  CONNECTOR_CONNECT: 'connector:connect',
  CONNECTOR_DISCONNECT: 'connector:disconnect',
  CONNECTOR_STATUS: 'connector:status',
  CONNECTOR_ALL_STATUS: 'connector:allStatus',
  CONNECTOR_LIST: 'connector:list',
  CONNECTOR_GET_EVENT_HISTORY: 'connector:getEventHistory',

  // Overlay
  OVERLAY_LIST: 'overlay:list',
  OVERLAY_SAVE: 'overlay:save',
  OVERLAY_PREVIEW: 'overlay:preview',

  // Plugin
  PLUGIN_LIST: 'plugin:list',
  PLUGIN_INSTALL: 'plugin:install',
  PLUGIN_DISABLE: 'plugin:disable',
  PLUGIN_REMOVE: 'plugin:remove',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:getAll',

  // System
  SYSTEM_GET_VERSION: 'system:getVersion',
  SYSTEM_GET_STATUS: 'system:getStatus',
  SYSTEM_RESTART: 'system:restart'
} as const

// Event types
export const EVENT_TYPES = {
  GIFT: 'gift',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  LIKE: 'like',
  SHARE: 'share',
  JOIN: 'join',
  SUBSCRIBE: 'subscribe',
  SUPERCHAT: 'superchat',
  MEMBERSHIP: 'membership',
  CUSTOM: 'custom'
} as const

// Platforms
export const PLATFORMS = {
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube'
} as const

// Action types
export const ACTION_TYPES = {
  KEYBOARD: 'keyboard',
  WEBSOCKET: 'websocket',
  OBS: 'obs',
  SOUND: 'sound',
  TTS: 'tts',
  OVERLAY: 'overlay'
} as const

// Log levels
export const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
} as const

// Database paths
export const DB_PATHS = {
  DATABASE: 'database.db',
  CONFIG: 'config.json',
  LOGS: 'logs'
} as const

// Application defaults
export const DEFAULTS = {
  OBS_PORT: 4455,
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 5000,
  MAX_MASTER_VOLUME: 100,
  WS_PORT: 8765
} as const
