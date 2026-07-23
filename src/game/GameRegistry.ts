import { Logger } from '@services/logger'
import { GameRegistration, GameStatus, GameAdapterConfig, DEFAULT_ADAPTER_CONFIG } from './types'

const logger = new Logger('GameRegistry')

/**
 * GameRegistry - Manages registered games and their configurations
 * 
 * Features:
 * - Register/unregister games
 * - Enable/disable games
 * - Track game status
 * - Persist configurations
 * 
 * Usage:
 *   const registry = GameRegistry.getInstance()
 *   registry.registerGame({
 *     id: 'gta5',
 *     name: 'Grand Theft Auto V',
 *     adapter: 'GTAAdapter',
 *     ...
 *   })
 */
export class GameRegistry {
  private static instance: GameRegistry
  private games: Map<string, GameRegistration> = new Map()
  private activeGameId: string | null = null

  private constructor() {
    logger.debug('GameRegistry initialized')
  }

  static getInstance(): GameRegistry {
    if (!GameRegistry.instance) {
      GameRegistry.instance = new GameRegistry()
    }
    return GameRegistry.instance
  }

  /**
   * Register a new game
   */
  registerGame(game: GameRegistration): void {
    if (this.games.has(game.id)) {
      logger.warning(`Game ${game.id} already registered, updating`)
    }

    this.games.set(game.id, {
      ...game,
      installedAt: game.installedAt || new Date().toISOString()
    })

    logger.info(`Registered game: ${game.name} (${game.id})`)
  }

  /**
   * Unregister a game
   */
  unregisterGame(gameId: string): boolean {
    const game = this.games.get(gameId)
    if (!game) {
      logger.warning(`Game ${gameId} not found`)
      return false
    }

    this.games.delete(gameId)

    if (this.activeGameId === gameId) {
      this.activeGameId = null
    }

    logger.info(`Unregistered game: ${game.name} (${gameId})`)
    return true
  }

  /**
   * Get a registered game
   */
  getGame(gameId: string): GameRegistration | undefined {
    return this.games.get(gameId)
  }

  /**
   * Get all registered games
   */
  getAllGames(): GameRegistration[] {
    return Array.from(this.games.values())
  }

  /**
   * Get games by status
   */
  getGamesByStatus(status: GameStatus): GameRegistration[] {
    return this.getAllGames().filter(g => g.status === status)
  }

  /**
   * Update game status
   */
  updateStatus(gameId: string, status: GameStatus): boolean {
    const game = this.games.get(gameId)
    if (!game) {
      logger.warning(`Game ${gameId} not found`)
      return false
    }

    game.status = status
    logger.debug(`[${gameId}] Status updated to: ${status}`)
    return true
  }

  /**
   * Update game configuration
   */
  updateConfig(gameId: string, config: Partial<GameAdapterConfig>): boolean {
    const game = this.games.get(gameId)
    if (!game) {
      logger.warning(`Game ${gameId} not found`)
      return false
    }

    game.config = {
      ...game.config,
      ...config
    }

    logger.debug(`[${gameId}] Configuration updated`)
    return true
  }

  /**
   * Set active game
   */
  setActiveGame(gameId: string | null): void {
    if (gameId && !this.games.has(gameId)) {
      logger.warning(`Cannot set active game: ${gameId} not registered`)
      return
    }

    this.activeGameId = gameId
    logger.info(`Active game set to: ${gameId || 'none'}`)
  }

  /**
   * Get active game
   */
  getActiveGame(): GameRegistration | null {
    if (!this.activeGameId) return null
    return this.games.get(this.activeGameId) || null
  }

  /**
   * Check if a game is registered
   */
  hasGame(gameId: string): boolean {
    return this.games.has(gameId)
  }

  /**
   * Get registered game IDs
   */
  getGameIds(): string[] {
    return Array.from(this.games.keys())
  }

  /**
   * Update last used timestamp
   */
  updateLastUsed(gameId: string): void {
    const game = this.games.get(gameId)
    if (game) {
      game.lastUsed = new Date().toISOString()
    }
  }

  /**
   * Load games from database
   */
  loadFromData(games: GameRegistration[]): void {
    this.games.clear()
    for (const game of games) {
      this.games.set(game.id, game)
    }
    logger.info(`Loaded ${games.length} games from database`)
  }

  /**
   * Export all games as array
   */
  exportGames(): GameRegistration[] {
    return this.getAllGames()
  }

  /**
   * Clear all registered games
   */
  clear(): void {
    this.games.clear()
    this.activeGameId = null
    logger.debug('GameRegistry cleared')
  }
}
