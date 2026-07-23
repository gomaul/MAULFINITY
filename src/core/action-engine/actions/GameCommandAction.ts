import { Action } from '../ActionEngine'
import { MaulfinityEvent } from '@core/event-bus/types'
import { Logger } from '@services/logger'

const logger = new Logger('GameCommandAction')

/**
 * GameCommandAction - Execute commands on connected games
 * 
 * Config:
 *   gameId: string - Target game ID
 *   action: string - Command action (e.g., 'spawn.vehicle')
 *   params: Record<string, unknown> - Command parameters
 * 
 * Usage:
 *   {
 *     type: 'game',
 *     config: {
 *       gameId: 'gta5',
 *       action: 'spawn.vehicle',
 *       params: { model: 'adder', position: { x: 100, y: 200, z: 30 } }
 *     }
 *   }
 */
export class GameCommandAction implements Action {
  name = 'game'

  validate(config: Record<string, unknown>): boolean {
    if (!config.gameId || typeof config.gameId !== 'string') {
      logger.error('GameCommandAction: gameId is required')
      return false
    }
    if (!config.action || typeof config.action !== 'string') {
      logger.error('GameCommandAction: action is required')
      return false
    }
    return true
  }

  async execute(config: Record<string, unknown>, event: MaulfinityEvent): Promise<void> {
    const gameId = config.gameId as string
    const action = config.action as string
    const params = (config.params as Record<string, unknown>) || {}

    logger.info(`Executing game command: ${action} on ${gameId}`)

    try {
      // Get GameManager from service container
      const { ServiceContainer } = await import('@core/service-container/ServiceContainer')
      const container = ServiceContainer.getInstance()
      const gameManager = container.get('gameManager') as import('../../../game/GameManager').GameManager | undefined

      if (!gameManager) {
        logger.warning('GameManager not available in service container')
        return
      }

      // Check if game is connected
      if (!gameManager.isConnected(gameId)) {
        logger.warning(`Game ${gameId} is not connected`)
        return
      }

      // Resolve template variables in params
      const resolvedParams = this.resolveTemplates(params, event)

      // Send command
      const result = await gameManager.sendCommand(gameId, {
        action,
        params: resolvedParams
      })

      if (result.success) {
        logger.info(`Game command completed: ${action} in ${result.duration}ms`)
      } else {
        logger.warning(`Game command failed: ${result.error}`)
      }
    } catch (error) {
      logger.error(`Failed to execute game command: ${action}`, error as Error)
    }
  }

  /**
   * Resolve template variables in params
   * e.g., "{{user}}" → event.user
   */
  private resolveTemplates(
    params: Record<string, unknown>,
    event: MaulfinityEvent
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        resolved[key] = value
          .replace(/\{\{user\}\}/g, event.user)
          .replace(/\{\{type\}\}/g, event.type)
          .replace(/\{\{platform\}\}/g, event.platform)
          .replace(/\{\{timestamp\}\}/g, String(event.timestamp))
      } else {
        resolved[key] = value
      }
    }

    return resolved
  }

  settings(): Record<string, unknown> {
    return {
      gameId: { type: 'string', required: true, label: 'Game ID' },
      action: { type: 'string', required: true, label: 'Command Action' },
      params: { type: 'object', label: 'Parameters' }
    }
  }
}
