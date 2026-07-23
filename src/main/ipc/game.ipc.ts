import { ipcMain } from 'electron'
import { GameManager } from '../../game/GameManager'
import { GameRepository } from '../../services/database/repositories/GameRepository'
import { GameAdapterConfig, GameCommand } from '../../game/types'

const gameManager = GameManager.getInstance()
const gameRepo = new GameRepository()

/**
 * Register game IPC handlers
 */
export function registerGameIpc(): void {
  // ============================================================
  // GAME LIST
  // ============================================================
  ipcMain.handle('game:list', async () => {
    try {
      const games = gameRepo.findAll()
      return { success: true, data: games }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // GAME REGISTER
  // ============================================================
  ipcMain.handle('game:register', async (_event, data: {
    id: string
    name: string
    adapter: string
    version?: string
    description?: string
    config?: Partial<GameAdapterConfig>
  }) => {
    try {
      // Create in database
      const game = gameRepo.create({
        id: data.id,
        name: data.name,
        version: data.version || '1.0.0',
        adapter: data.adapter,
        adapter_version: '1.0.0',
        description: data.description || null,
        status: 'installed',
        enabled: 1,
        settings_json: JSON.stringify(data.config || {})
      })

      // Register in manager
      const success = await gameManager.registerGame({
        id: data.id,
        name: data.name,
        version: data.version || '1.0.0',
        description: data.description || '',
        adapter: data.adapter,
        adapterVersion: '1.0.0',
        config: data.config
      })

      return { success, data: game }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // GAME REMOVE
  // ============================================================
  ipcMain.handle('game:remove', async (_event, gameId: string) => {
    try {
      await gameManager.unregisterGame(gameId)
      gameRepo.delete(gameId)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // GAME CONNECT
  // ============================================================
  ipcMain.handle('game:connect', async (_event, gameId: string) => {
    try {
      const success = await gameManager.connectGame(gameId)
      if (success) {
        gameRepo.updateStatus(gameId, 'connected')
        gameRepo.updateLastUsed(gameId)
      }
      return { success }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // GAME DISCONNECT
  // ============================================================
  ipcMain.handle('game:disconnect', async (_event, gameId: string) => {
    try {
      const success = await gameManager.disconnectGame(gameId)
      if (success) {
        gameRepo.updateStatus(gameId, 'configured')
      }
      return { success }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // GAME GET STATE
  // ============================================================
  ipcMain.handle('game:get-state', async (_event, gameId: string) => {
    try {
      const state = gameManager.getGameStateData(gameId)
      const adapterState = gameManager.getGameState(gameId)
      return {
        success: true,
        data: {
          adapterState,
          gameState: state ? {
            ...state,
            players: state.players ? Array.from(state.players.values()) : [],
            vehicles: state.vehicles ? Array.from(state.vehicles.values()) : [],
            world: state.world
          } : null
        }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // GAME SEND COMMAND
  // ============================================================
  ipcMain.handle('game:send-command', async (_event, gameId: string, command: GameCommand) => {
    try {
      const result = await gameManager.sendCommand(gameId, command)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // GAME GET ALL STATUS
  // ============================================================
  ipcMain.handle('game:get-all-status', async () => {
    try {
      const statuses = gameManager.getAllStatuses()
      return { success: true, data: statuses }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // GAME TEST EVENT
  // ============================================================
  ipcMain.handle('game:test-event', async (_event, data: {
    gameId: string
    type: string
    eventData: Record<string, unknown>
  }) => {
    try {
      const normalizer = gameManager.getNormalizer()
      const rawEvent = {
        type: data.type,
        timestamp: Date.now(),
        data: data.eventData
      }
      const normalized = normalizer.normalize(data.gameId, 'test', rawEvent)
      return { success: true, data: normalized }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  console.log('Game IPC handlers registered')
}
