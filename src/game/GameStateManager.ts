import { Logger } from '@services/logger'
import { GameState, PlayerState, VehicleState, WorldState, StateUpdate, StateChangeCallback } from './types'

const logger = new Logger('GameStateManager')

/**
 * GameStateManager - Maintains current state for each connected game
 * 
 * State is reactive - subscribers are notified of any changes.
 * 
 * Features:
 * - Per-game state tracking
 * - Player state management
 * - Vehicle state management
 * - World state management
 * - Change notification callbacks
 * 
 * Usage:
 *   const manager = new GameStateManager()
 *   manager.initializeGame('gta5')
 *   manager.updatePlayerState('gta5', 'player1', { health: 80 })
 */
export class GameStateManager {
  /** Game states indexed by gameId */
  private states: Map<string, GameState> = new Map()

  /** State change subscribers indexed by gameId */
  private subscribers: Map<string, StateChangeCallback[]> = new Map()

  /** Global subscribers (all games) */
  private globalSubscribers: StateChangeCallback[] = []

  constructor() {
    logger.debug('GameStateManager initialized')
  }

  /**
   * Initialize state for a new game
   */
  initializeGame(gameId: string): void {
    const initialState: GameState = {
      gameId,
      timestamp: Date.now(),
      connected: false,
      players: new Map(),
      vehicles: new Map(),
      world: {
        weather: 'clear',
        time: { hour: 12, minute: 0 },
        area: 'unknown',
        isNight: false
      }
    }

    this.states.set(gameId, initialState)
    logger.info(`Initialized state for game: ${gameId}`)
  }

  /**
   * Remove state for a game
   */
  removeGame(gameId: string): void {
    this.states.delete(gameId)
    this.subscribers.delete(gameId)
    logger.info(`Removed state for game: ${gameId}`)
  }

  /**
   * Get state for a specific game
   */
  getState(gameId: string): GameState | undefined {
    return this.states.get(gameId)
  }

  /**
   * Get all game states
   */
  getAllStates(): GameState[] {
    return Array.from(this.states.values())
  }

  /**
   * Check if a game has state
   */
  hasState(gameId: string): boolean {
    return this.states.has(gameId)
  }

  /**
   * Update connection status
   */
  updateConnection(gameId: string, connected: boolean): void {
    const state = this.states.get(gameId)
    if (!state) return

    state.connected = connected
    state.timestamp = Date.now()

    this.notifySubscribers(gameId, {
      path: 'connected',
      operation: 'set',
      value: connected,
      timestamp: Date.now()
    })

    logger.debug(`[${gameId}] Connection: ${connected}`)
  }

  /**
   * Update player state
   */
  updatePlayerState(gameId: string, playerId: string, update: Partial<PlayerState>): void {
    const state = this.states.get(gameId)
    if (!state) return

    const existing = state.players.get(playerId) || this.createDefaultPlayer(playerId)
    
    // Merge update
    const updated: PlayerState = {
      ...existing,
      ...update,
      id: playerId
    }

    state.players.set(playerId, updated)
    state.timestamp = Date.now()

    this.notifySubscribers(gameId, {
      path: `player.${playerId}`,
      operation: 'set',
      value: updated,
      timestamp: Date.now()
    })

    logger.debug(`[${gameId}] Player ${playerId} updated`)
  }

  /**
   * Get player state
   */
  getPlayerState(gameId: string, playerId: string): PlayerState | undefined {
    const state = this.states.get(gameId)
    return state?.players.get(playerId)
  }

  /**
   * Get all players for a game
   */
  getPlayers(gameId: string): PlayerState[] {
    const state = this.states.get(gameId)
    if (!state) return []
    return Array.from(state.players.values())
  }

  /**
   * Remove a player
   */
  removePlayer(gameId: string, playerId: string): void {
    const state = this.states.get(gameId)
    if (!state) return

    state.players.delete(playerId)
    state.timestamp = Date.now()

    this.notifySubscribers(gameId, {
      path: `player.${playerId}`,
      operation: 'remove',
      value: null,
      timestamp: Date.now()
    })
  }

  /**
   * Update vehicle state
   */
  updateVehicleState(gameId: string, vehicleId: string, update: Partial<VehicleState>): void {
    const state = this.states.get(gameId)
    if (!state) return

    const existing = state.vehicles.get(vehicleId) || this.createDefaultVehicle(vehicleId)
    
    // Merge update
    const updated: VehicleState = {
      ...existing,
      ...update,
      id: vehicleId
    }

    state.vehicles.set(vehicleId, updated)
    state.timestamp = Date.now()

    this.notifySubscribers(gameId, {
      path: `vehicle.${vehicleId}`,
      operation: 'set',
      value: updated,
      timestamp: Date.now()
    })
  }

  /**
   * Get vehicle state
   */
  getVehicleState(gameId: string, vehicleId: string): VehicleState | undefined {
    const state = this.states.get(gameId)
    return state?.vehicles.get(vehicleId)
  }

  /**
   * Get all vehicles for a game
   */
  getVehicles(gameId: string): VehicleState[] {
    const state = this.states.get(gameId)
    if (!state) return []
    return Array.from(state.vehicles.values())
  }

  /**
   * Remove a vehicle
   */
  removeVehicle(gameId: string, vehicleId: string): void {
    const state = this.states.get(gameId)
    if (!state) return

    state.vehicles.delete(vehicleId)
    state.timestamp = Date.now()

    this.notifySubscribers(gameId, {
      path: `vehicle.${vehicleId}`,
      operation: 'remove',
      value: null,
      timestamp: Date.now()
    })
  }

  /**
   * Update world state
   */
  updateWorldState(gameId: string, update: Partial<WorldState>): void {
    const state = this.states.get(gameId)
    if (!state) return

    state.world = {
      ...state.world,
      ...update
    }
    state.timestamp = Date.now()

    this.notifySubscribers(gameId, {
      path: 'world',
      operation: 'set',
      value: state.world,
      timestamp: Date.now()
    })
  }

  /**
   * Subscribe to state changes for a specific game
   */
  subscribe(gameId: string, callback: StateChangeCallback): () => void {
    if (!this.subscribers.has(gameId)) {
      this.subscribers.set(gameId, [])
    }
    this.subscribers.get(gameId)!.push(callback)

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(gameId)
      if (subs) {
        const index = subs.indexOf(callback)
        if (index > -1) {
          subs.splice(index, 1)
        }
      }
    }
  }

  /**
   * Subscribe to all state changes
   */
  subscribeAll(callback: StateChangeCallback): () => void {
    this.globalSubscribers.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.globalSubscribers.indexOf(callback)
      if (index > -1) {
        this.globalSubscribers.splice(index, 1)
      }
    }
  }

  /**
   * Notify subscribers of state change
   */
  private notifySubscribers(gameId: string, update: StateUpdate): void {
    // Notify game-specific subscribers
    const gameSubs = this.subscribers.get(gameId)
    if (gameSubs) {
      for (const callback of gameSubs) {
        try {
          callback(update)
        } catch (error) {
          logger.error(`Error in state subscriber for ${gameId}`, error as Error)
        }
      }
    }

    // Notify global subscribers
    for (const callback of this.globalSubscribers) {
      try {
        callback(update)
      } catch (error) {
        logger.error('Error in global state subscriber', error as Error)
      }
    }
  }

  /**
   * Create default player state
   */
  private createDefaultPlayer(playerId: string): PlayerState {
    return {
      id: playerId,
      name: 'Unknown',
      health: 100,
      maxHealth: 100,
      armor: 0,
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      isInVehicle: false,
      weapons: [],
      money: 0,
      wantedLevel: 0
    }
  }

  /**
   * Create default vehicle state
   */
  private createDefaultVehicle(vehicleId: string): VehicleState {
    return {
      id: vehicleId,
      model: 'unknown',
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      health: 100,
      speed: 0,
      passengers: []
    }
  }

  /**
   * Clear all states
   */
  clear(): void {
    this.states.clear()
    this.subscribers.clear()
    this.globalSubscribers = []
    logger.debug('All game states cleared')
  }
}
