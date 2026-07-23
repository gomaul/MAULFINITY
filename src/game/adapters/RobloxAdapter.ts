import { BaseGameAdapter } from './BaseGameAdapter'
import { WebSocketBridge } from '../bridges/WebSocketBridge'
import {
  GameInfo,
  GameCommand,
  GameCommandResult,
  GameAdapterConfig
} from '../types'

/**
 * RobloxAdapter - Roblox integration adapter
 * 
 * Connects to Roblox via WebSocket bridge.
 * 
 * Events:
 * - player.joined, player.left
 * - player.level.changed
 * - player.score.changed
 * 
 * Commands:
 * - teleport
 * - set.health
 * - give.item
 * - trigger.effect
 */
export class RobloxAdapter extends BaseGameAdapter {
  readonly gameId = 'roblox'
  readonly gameName = 'Roblox'
  readonly version = '1.0.0'
  readonly author = 'Maulfinity'

  constructor(gameId: string, config: GameAdapterConfig) {
    super(gameId, config)
  }

  getGameInfo(): GameInfo {
    return {
      id: this.gameId,
      name: this.gameName,
      version: '1.0.0',
      description: 'Roblox integration via WebSocket',
      icon: '🎮',
      platform: 'pc',
      adapterVersion: this.version,
      supportedEvents: this.getSupportedEvents(),
      supportedCommands: this.getSupportedCommands()
    }
  }

  getSupportedEvents(): string[] {
    return [
      'player.joined',
      'player.left',
      'player.level.changed',
      'player.score.changed',
      'player.health.changed'
    ]
  }

  getSupportedCommands(): string[] {
    return [
      'teleport',
      'set.health',
      'give.item',
      'trigger.effect'
    ]
  }

  protected async connectToGame(): Promise<boolean> {
    const bridgeConfig = this.config.bridgeConfig as { host: string; port: number }
    this.bridge = new WebSocketBridge({
      host: bridgeConfig.host || 'localhost',
      port: bridgeConfig.port || 8766
    })

    this.bridge.onMessage((data: unknown) => {
      const message = data as { event?: string; type?: string; data?: Record<string, unknown> }
      if (message.event || message.type) {
        this.emitGameEvent(
          message.event || message.type || 'unknown',
          message.data || {}
        )
      }
    })

    this.bridge.onError((error: Error) => {
      this.logger.error('Bridge error', error)
    })

    this.bridge.onClose(() => {
      this.logger.info('Bridge connection closed')
    })

    return this.bridge.connect()
  }

  protected async disconnectFromGame(): Promise<void> {
    if (this.bridge) {
      await this.bridge.disconnect()
      this.bridge.removeAllListeners()
      this.bridge = null
    }
  }

  protected async sendCommandToGame(command: GameCommand): Promise<GameCommandResult> {
    if (!this.bridge || !this.bridge.isConnected()) {
      return {
        success: false,
        error: 'Bridge not connected',
        duration: 0
      }
    }

    const startTime = Date.now()

    try {
      const response = await this.bridge.send({
        action: command.action,
        params: command.params,
        id: `cmd_${Date.now()}`
      })

      return {
        success: true,
        data: response,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        duration: Date.now() - startTime
      }
    }
  }
}
