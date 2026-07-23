import { GameRawEvent, GameEvent, EventMapping } from '../types'

/**
 * Game Event Helpers
 * 
 * Utility functions for working with game events
 */

/**
 * Create a game event from raw data
 */
export function createGameEvent(
  gameId: string,
  adapterId: string,
  type: string,
  data: Record<string, unknown>,
  playerName?: string
): GameRawEvent {
  return {
    type,
    timestamp: Date.now(),
    data: {
      ...data,
      playerName: playerName || data.playerName || 'unknown'
    }
  }
}

/**
 * Create event mapping
 */
export function createEventMapping(
  gameEvent: string,
  normalizedEvent: string,
  category: import('../types').GameEventCategory,
  transformer?: (data: Record<string, unknown>) => Record<string, unknown>
): EventMapping {
  return {
    gameEvent,
    normalizedEvent,
    category,
    transformer
  }
}

/**
 * Common event mappings for games
 */
export const COMMON_EVENT_MAPPINGS: EventMapping[] = [
  // Player events
  createEventMapping('spawn', 'player.spawned', 'player'),
  createEventMapping('death', 'player.death', 'player'),
  createEventMapping('health', 'player.health.changed', 'player'),
  createEventMapping('armor', 'player.armor.changed', 'player'),
  
  // Vehicle events
  createEventMapping('vehicle_spawn', 'vehicle.spawned', 'vehicle'),
  createEventMapping('vehicle_enter', 'vehicle.entered', 'vehicle'),
  createEventMapping('vehicle_exit', 'vehicle.exited', 'vehicle'),
  
  // Combat events
  createEventMapping('weapon_fire', 'combat.weapon.fired', 'combat'),
  createEventMapping('damage', 'combat.damage', 'combat'),
  createEventMapping('kill', 'combat.kill', 'combat')
]

/**
 * GTA-specific event mappings
 */
export const GTA_EVENT_MAPPINGS: EventMapping[] = [
  ...COMMON_EVENT_MAPPINGS,
  createEventMapping('player_spawned', 'player.spawned', 'player'),
  createEventMapping('player_died', 'player.death', 'player'),
  createEventMapping('vehicle_created', 'vehicle.spawned', 'vehicle'),
  createEventMapping('money_changed', 'player.money.changed', 'player',
    (data) => ({ amount: data.amount || data.value || 0 })
  ),
  createEventMapping('wanted_level', 'player.wanted.changed', 'player',
    (data) => ({ level: data.level || 0 })
  )
]

/**
 * Roblox-specific event mappings
 */
export const ROBLOX_EVENT_MAPPINGS: EventMapping[] = [
  ...COMMON_EVENT_MAPPINGS,
  createEventMapping('player_join', 'player.joined', 'player'),
  createEventMapping('player_leave', 'player.left', 'player'),
  createEventMapping('level_up', 'player.level.changed', 'player',
    (data) => ({ level: data.level || 1 })
  ),
  createEventMapping('score_change', 'player.score.changed', 'player',
    (data) => ({ score: data.score || 0 })
  )
]
