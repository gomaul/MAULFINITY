import { v4 as uuidv4 } from 'uuid'
import { Logger } from '@services/logger'
import { GameRawEvent, GameEvent, EventMapping, GameEventCategory } from './types'

const logger = new Logger('GameEventNormalizer')

/**
 * GameEventNormalizer - Converts game-specific events into normalized MaulfinityEvent format
 * 
 * Different games use different event naming and data structures.
 * This normalizer maps them all to a consistent format.
 * 
 * Flow:
 *   GameRawEvent → normalize() → GameEvent (extends MaulfinityEvent)
 * 
 * Usage:
 *   const normalizer = new GameEventNormalizer()
 *   const normalized = normalizer.normalize('gta5', {
 *     type: 'player_spawned',
 *     timestamp: Date.now(),
 *     data: { position: { x: 100, y: 200, z: 30 } }
 *   })
 */
export class GameEventNormalizer {
  /** Event mappings indexed by gameId */
  private mappings: Map<string, EventMapping[]> = new Map()

  /** Default mappings for common events */
  private defaultMappings: EventMapping[] = [
    // Player events
    { gameEvent: 'player_spawn', normalizedEvent: 'player.spawned', category: 'player' },
    { gameEvent: 'player_spawned', normalizedEvent: 'player.spawned', category: 'player' },
    { gameEvent: 'player_death', normalizedEvent: 'player.death', category: 'player' },
    { gameEvent: 'player_died', normalizedEvent: 'player.death', category: 'player' },
    { gameEvent: 'health_changed', normalizedEvent: 'player.health.changed', category: 'player' },
    { gameEvent: 'armor_changed', normalizedEvent: 'player.armor.changed', category: 'player' },
    { gameEvent: 'money_changed', normalizedEvent: 'player.money.changed', category: 'player' },
    { gameEvent: 'wanted_level', normalizedEvent: 'player.wanted.changed', category: 'player' },
    
    // Vehicle events
    { gameEvent: 'vehicle_spawn', normalizedEvent: 'vehicle.spawned', category: 'vehicle' },
    { gameEvent: 'vehicle_created', normalizedEvent: 'vehicle.spawned', category: 'vehicle' },
    { gameEvent: 'vehicle_destroy', normalizedEvent: 'vehicle.destroyed', category: 'vehicle' },
    { gameEvent: 'vehicle_enter', normalizedEvent: 'vehicle.entered', category: 'vehicle' },
    { gameEvent: 'vehicle_exit', normalizedEvent: 'vehicle.exited', category: 'vehicle' },
    { gameEvent: 'vehicle_damage', normalizedEvent: 'vehicle.damaged', category: 'vehicle' },
    
    // Combat events
    { gameEvent: 'weapon_fire', normalizedEvent: 'combat.weapon.fired', category: 'combat' },
    { gameEvent: 'player_damage', normalizedEvent: 'combat.damage', category: 'combat' },
    { gameEvent: 'player_kill', normalizedEvent: 'combat.kill', category: 'combat' },
    
    // World events
    { gameEvent: 'weather_change', normalizedEvent: 'world.weather.changed', category: 'world' },
    { gameEvent: 'time_change', normalizedEvent: 'world.time.changed', category: 'world' },
    
    // Economy events
    { gameEvent: 'money_gained', normalizedEvent: 'economy.money.gained', category: 'economy' },
    { gameEvent: 'money_lost', normalizedEvent: 'economy.money.lost', category: 'economy' }
  ]

  constructor() {
    logger.debug('GameEventNormalizer initialized')
  }

  /**
   * Register event mappings for a game
   */
  registerMappings(gameId: string, mappings: EventMapping[]): void {
    this.mappings.set(gameId, mappings)
    logger.info(`Registered ${mappings.length} event mappings for ${gameId}`)
  }

  /**
   * Get mappings for a game
   */
  getMappings(gameId: string): EventMapping[] {
    return this.mappings.get(gameId) || []
  }

  /**
   * Get all registered games
   */
  getSupportedGames(): string[] {
    return Array.from(this.mappings.keys())
  }

  /**
   * Normalize a game event to MaulfinityEvent format
   */
  normalize(gameId: string, adapterId: string, rawEvent: GameRawEvent): GameEvent {
    const mappings = this.mappings.get(gameId) || []
    const allMappings = [...this.defaultMappings, ...mappings]

    // Find matching mapping
    const mapping = allMappings.find(
      m => m.gameEvent.toLowerCase() === rawEvent.type.toLowerCase()
    )

    // Get normalized event type
    const normalizedType = mapping
      ? mapping.normalizedEvent
      : this.normalizeEventType(rawEvent.type)

    // Get category
    const category = mapping?.category || this.inferCategory(rawEvent.type)

    // Transform data if transformer exists, otherwise use raw data
    let transformedData = rawEvent.data
    if (mapping?.transformer) {
      transformedData = mapping.transformer(rawEvent.data)
    }

    // Create normalized event
    const event: GameEvent = {
      id: uuidv4(),
      type: normalizedType,
      platform: 'game',
      user: (rawEvent.data.playerName as string) || (rawEvent.data.username as string) || 'unknown',
      payload: {
        category,
        action: normalizedType,
        gameId,
        data: transformedData
      },
      timestamp: rawEvent.timestamp || Date.now(),
      source: {
        gameId,
        adapterId
      }
    }

    logger.debug(`[${gameId}] Normalized: ${rawEvent.type} → ${normalizedType}`)

    return event
  }

  /**
   * Normalize multiple events at once
   */
  normalizeMany(gameId: string, adapterId: string, events: GameRawEvent[]): GameEvent[] {
    return events.map(event => this.normalize(gameId, adapterId, event))
  }

  /**
   * Normalize event type to standard format
   */
  private normalizeEventType(type: string): string {
    // Convert snake_case or camelCase to dot notation
    return type
      .toLowerCase()
      .replace(/([a-z])([A-Z])/g, '$1.$2')
      .replace(/_/g, '.')
      .replace(/\s+/g, '.')
  }

  /**
   * Infer category from event type
   */
  private inferCategory(type: string): GameEventCategory {
    const lower = type.toLowerCase()
    
    if (lower.includes('player') || lower.includes('health') || lower.includes('armor')) {
      return 'player'
    }
    if (lower.includes('vehicle') || lower.includes('car')) {
      return 'vehicle'
    }
    if (lower.includes('weapon') || lower.includes('damage') || lower.includes('kill')) {
      return 'combat'
    }
    if (lower.includes('weather') || lower.includes('time') || lower.includes('world')) {
      return 'world'
    }
    if (lower.includes('money') || lower.includes('coin') || lower.includes('score')) {
      return 'economy'
    }
    
    return 'custom'
  }

  /**
   * Validate a normalized event
   */
  validate(event: GameEvent): boolean {
    if (!event.id || !event.type || !event.platform) {
      logger.warning('Invalid event: missing required fields')
      return false
    }
    if (event.platform !== 'game') {
      logger.warning('Invalid event: platform must be "game"')
      return false
    }
    if (!event.source?.gameId) {
      logger.warning('Invalid event: missing source.gameId')
      return false
    }
    if (typeof event.timestamp !== 'number') {
      logger.warning('Invalid event: missing or invalid timestamp')
      return false
    }
    return true
  }
}
