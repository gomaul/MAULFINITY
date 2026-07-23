import { EventEmitter } from 'events'
import { EventBus } from '@core/event-bus/EventBus'
import { Logger } from '@services/logger'
import { IGameAdapter } from './GameAdapter'
import { GameRegistry } from './GameRegistry'
import { GameStateManager } from './GameStateManager'
import { GameEventNormalizer } from './EventNormalizer'
import {
  GameRegistration,
  GameAdapterConfig,
  GameAdapterState,
  GameAdapterStats,
  GameEvent,
  GameCommand,
  GameCommandResult,
  GameRawEvent,
  GameState,
  DEFAULT_ADAPTER_CONFIG
} from './types'

const logger = new Logger('GameManager')

/**
 * GameManager - Central orchestrator for all game integrations
 * 
 * Responsibilities:
 * - Manage game adapters lifecycle
 * - Coordinate event flow from games to EventBus
 * - Handle commands from ActionEngine to games
 * - Provide status information for UI
 * 
 * Architecture:
 *   Game → Adapter → Bridge → Normalizer → EventBus → Automation
 *   EventBus → ActionEngine → GameManager → Adapter → Game
 * 
 * Usage:
 *   const manager = GameManager.getInstance()
 *   await manager.connectGame('gta5')
 *   manager.getGameState('gta5')
 */
export class GameManager extends EventEmitter {
  private static instance: GameManager
  private eventBus: EventBus
  private registry: GameRegistry
  private stateManager: GameStateManager
  private normalizer: GameEventNormalizer

  /** Active adapters indexed by gameId */
  private adapters: Map<string, IGameAdapter> = new Map()

  /** Adapter constructors indexed by adapter name */
  private adapterFactories: Map<string, new (gameId: string, config: GameAdapterConfig) => IGameAdapter> = new Map()

  private constructor() {
    super()
    this.eventBus = EventBus.getInstance()
    this.registry = GameRegistry.getInstance()
    this.stateManager = new GameStateManager()
    this.normalizer = new GameEventNormalizer()
  }

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager()
    }
    return GameManager.instance
  }

  // ============================================================
  // ADAPTER FACTORY REGISTRATION
  // ============================================================

  /**
   * Register an adapter factory
   */
  registerAdapterFactory(
    name: string,
    factory: new (gameId: string, config: GameAdapterConfig) => IGameAdapter
  ): void {
    this.adapterFactories.set(name, factory)
    logger.info(`Registered adapter factory: ${name}`)
  }

  /**
   * Get registered adapter names
   */
  getAdapterTypes(): string[] {
    return Array.from(this.adapterFactories.keys())
  }

  // ============================================================
  // GAME LIFECYCLE
  // ============================================================

  /**
   * Register a new game
   */
  async registerGame(gameData: {
    id: string
    name: string
    version: string
    description: string
    adapter: string
    adapterVersion: string
    config?: Partial<GameAdapterConfig>
  }): Promise<boolean> {
    try {
      // Check if adapter factory exists
      if (!this.adapterFactories.has(gameData.adapter)) {
        logger.error(`Adapter type not found: ${gameData.adapter}`)
        return false
      }

      const config: GameAdapterConfig = {
        ...DEFAULT_ADAPTER_CONFIG,
        ...gameData.config
      }

      const registration: GameRegistration = {
        id: gameData.id,
        name: gameData.name,
        version: gameData.version,
        description: gameData.description,
        adapter: gameData.adapter,
        adapterVersion: gameData.adapterVersion,
        status: 'installed',
        config,
        installedAt: new Date().toISOString()
      }

      // Register in registry
      this.registry.registerGame(registration)

      // Initialize state
      this.stateManager.initializeGame(gameData.id)

      logger.info(`Game registered: ${gameData.name}`)
      this.emit('game:registered', { gameId: gameData.id })

      return true
    } catch (error) {
      logger.error('Failed to register game', error as Error)
      return false
    }
  }

  /**
   * Unregister a game
   */
  async unregisterGame(gameId: string): Promise<boolean> {
    try {
      // Disconnect if connected
      if (this.adapters.has(gameId)) {
        await this.disconnectGame(gameId)
      }

      // Remove from registry
      this.registry.unregisterGame(gameId)

      // Remove state
      this.stateManager.removeGame(gameId)

      logger.info(`Game unregistered: ${gameId}`)
      this.emit('game:unregistered', { gameId })

      return true
    } catch (error) {
      logger.error('Failed to unregister game', error as Error)
      return false
    }
  }

  /**
   * Enable a game
   */
  enableGame(gameId: string): boolean {
    const game = this.registry.getGame(gameId)
    if (!game) return false

    this.registry.updateStatus(gameId, 'configured')
    logger.info(`Game enabled: ${gameId}`)
    this.emit('game:enabled', { gameId })

    return true
  }

  /**
   * Disable a game
   */
  async disableGame(gameId: string): Promise<boolean> {
    const game = this.registry.getGame(gameId)
    if (!game) return false

    // Disconnect if connected
    if (this.adapters.has(gameId)) {
      await this.disconnectGame(gameId)
    }

    this.registry.updateStatus(gameId, 'disabled')
    logger.info(`Game disabled: ${gameId}`)
    this.emit('game:disabled', { gameId })

    return true
  }

  // ============================================================
  // CONNECTION MANAGEMENT
  // ============================================================

  /**
   * Connect to a game
   */
  async connectGame(gameId: string): Promise<boolean> {
    try {
      const game = this.registry.getGame(gameId)
      if (!game) {
        logger.error(`Game not found: ${gameId}`)
        return false
      }

      if (game.status === 'disabled') {
        logger.warning(`Game is disabled: ${gameId}`)
        return false
      }

      // Create adapter if not exists
      let adapter = this.adapters.get(gameId)
      if (!adapter) {
        adapter = this.createAdapter(gameId, game.config)
        if (!adapter) {
          return false
        }
        this.adapters.set(gameId, adapter)
      }

      // Connect
      const connected = await adapter.connect()
      if (connected) {
        this.registry.updateStatus(gameId, 'connected')
        this.registry.updateLastUsed(gameId)
        this.stateManager.updateConnection(gameId, true)

        // Set as active game
        this.registry.setActiveGame(gameId)

        logger.info(`Game connected: ${gameId}`)
        this.emit('game:connected', { gameId })

        return true
      }

      return false
    } catch (error) {
      logger.error(`Failed to connect to game: ${gameId}`, error as Error)
      this.registry.updateStatus(gameId, 'error')
      this.emit('game:error', { gameId, error: error as Error })
      return false
    }
  }

  /**
   * Disconnect from a game
   */
  async disconnectGame(gameId: string): Promise<boolean> {
    try {
      const adapter = this.adapters.get(gameId)
      if (!adapter) {
        logger.warning(`No adapter found for game: ${gameId}`)
        return false
      }

      await adapter.disconnect()

      this.adapters.delete(gameId)
      this.registry.updateStatus(gameId, 'configured')
      this.stateManager.updateConnection(gameId, false)

      // Clear active game if it was this one
      const activeGame = this.registry.getActiveGame()
      if (activeGame?.id === gameId) {
        this.registry.setActiveGame(null)
      }

      logger.info(`Game disconnected: ${gameId}`)
      this.emit('game:disconnected', { gameId })

      return true
    } catch (error) {
      logger.error(`Failed to disconnect from game: ${gameId}`, error as Error)
      return false
    }
  }

  /**
   * Disconnect all games
   */
  async disconnectAll(): Promise<void> {
    const gameIds = Array.from(this.adapters.keys())
    for (const gameId of gameIds) {
      await this.disconnectGame(gameId)
    }
  }

  // ============================================================
  // COMMAND EXECUTION
  // ============================================================

  /**
   * Send a command to a game
   */
  async sendCommand(gameId: string, command: GameCommand): Promise<GameCommandResult> {
    const adapter = this.adapters.get(gameId)
    if (!adapter) {
      return {
        success: false,
        error: 'Game not connected',
        duration: 0
      }
    }

    if (!adapter.isConnected()) {
      return {
        success: false,
        error: 'Game adapter not connected',
        duration: 0
      }
    }

    return adapter.sendCommand(command)
  }

  /**
   * Send command to active game
   */
  async sendCommandToActive(command: GameCommand): Promise<GameCommandResult> {
    const activeGame = this.registry.getActiveGame()
    if (!activeGame) {
      return {
        success: false,
        error: 'No active game',
        duration: 0
      }
    }

    return this.sendCommand(activeGame.id, command)
  }

  // ============================================================
  // EVENT HANDLING
  // ============================================================

  /**
   * Handle raw event from adapter
   */
  private async handleRawEvent(gameId: string, rawEvent: GameRawEvent): Promise<void> {
    try {
      const adapter = this.adapters.get(gameId)
      if (!adapter) return

      // Normalize event
      const normalizedEvent = this.normalizer.normalize(gameId, adapter.gameId, rawEvent)

      // Validate
      if (!this.normalizer.validate(normalizedEvent)) {
        logger.warning(`[${gameId}] Invalid event rejected`)
        return
      }

      // Emit to EventBus
      await this.eventBus.emit(normalizedEvent)

      // Emit locally
      this.emit('game:event', { gameId, event: normalizedEvent })

      logger.debug(`[${gameId}] Event: ${normalizedEvent.type}`)
    } catch (error) {
      logger.error(`[${gameId}] Failed to handle event`, error as Error)
    }
  }

  // ============================================================
  // QUERY METHODS
  // ============================================================

  /**
   * Get game adapter state
   */
  getGameState(gameId: string): GameAdapterState | undefined {
    const adapter = this.adapters.get(gameId)
    return adapter?.getState()
  }

  /**
   * Get game state data
   */
  getGameStateData(gameId: string): GameState | undefined {
    return this.stateManager.getState(gameId)
  }

  /**
   * Get all game statuses
   */
  getAllStatuses(): Array<{
    game: GameRegistration
    connected: boolean
    state: GameAdapterState | null
    stats: GameAdapterStats | null
  }> {
    const games = this.registry.getAllGames()
    return games.map(game => {
      const adapter = this.adapters.get(game.id)
      return {
        game,
        connected: adapter?.isConnected() ?? false,
        state: adapter?.getState() ?? null,
        stats: adapter?.getStats() ?? null
      }
    })
  }

  /**
   * Check if a game is connected
   */
  isConnected(gameId: string): boolean {
    const adapter = this.adapters.get(gameId)
    return adapter?.isConnected() ?? false
  }

  /**
   * Get state manager
   */
  getStateManager(): GameStateManager {
    return this.stateManager
  }

  /**
   * Get event normalizer
   */
  getNormalizer(): GameEventNormalizer {
    return this.normalizer
  }

  /**
   * Get registry
   */
  getRegistry(): GameRegistry {
    return this.registry
  }

  // ============================================================
  // INTERNAL HELPERS
  // ============================================================

  /**
   * Create an adapter instance
   */
  private createAdapter(gameId: string, config: GameAdapterConfig): IGameAdapter | null {
    const game = this.registry.getGame(gameId)
    if (!game) return null

    const Factory = this.adapterFactories.get(game.adapter)
    if (!Factory) {
      logger.error(`Adapter factory not found: ${game.adapter}`)
      return null
    }

    const adapter = new Factory(gameId, config)

    // Subscribe to adapter events
    adapter.subscribeEvents((event) => {
      this.handleRawEvent(gameId, event)
    })

    return adapter
  }

  /**
   * Load games from database
   */
  loadGames(games: GameRegistration[]): void {
    this.registry.loadFromData(games)
    logger.info(`Loaded ${games.length} games`)
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    await this.disconnectAll()
    this.adapters.clear()
    this.adapterFactories.clear()
    this.stateManager.clear()
    this.registry.clear()
    this.removeAllListeners()
    logger.info('GameManager destroyed')
  }
}
