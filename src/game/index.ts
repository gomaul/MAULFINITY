/**
 * Game Integration Framework
 * 
 * Module exports for the game integration system.
 * 
 * Architecture:
 *   Game → Adapter → Bridge → EventNormalizer → EventBus → Automation
 * 
 * Usage:
 *   import { GameManager, GTAAdapter } from '@game'
 *   
 *   const manager = GameManager.getInstance()
 *   manager.registerAdapterFactory('GTAAdapter', GTAAdapter)
 *   await manager.registerGame({ id: 'gta5', name: 'GTA V', adapter: 'GTAAdapter', ... })
 *   await manager.connectGame('gta5')
 */

// Core classes
export { GameManager } from './GameManager'
export { GameRegistry } from './GameRegistry'
export { GameStateManager } from './GameStateManager'
export { GameEventNormalizer } from './EventNormalizer'

// Interfaces
export { IGameAdapter } from './GameAdapter'
export { IGameBridge } from './GameBridge'

// Adapters
export { BaseGameAdapter } from './adapters/BaseGameAdapter'
export { GTAAdapter } from './adapters/GTAAdapter'
export { RobloxAdapter } from './adapters/RobloxAdapter'
export { CustomAdapter } from './adapters/CustomAdapter'

// Bridges
export { WebSocketBridge } from './bridges/WebSocketBridge'
export { LocalSocketBridge } from './bridges/LocalSocketBridge'
export { FileWatcherBridge } from './bridges/FileWatcherBridge'

// Event helpers
export {
  createGameEvent,
  createEventMapping,
  COMMON_EVENT_MAPPINGS,
  GTA_EVENT_MAPPINGS,
  ROBLOX_EVENT_MAPPINGS
} from './events'

// Types
export * from './types'
