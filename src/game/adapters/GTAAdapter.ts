import { BaseGameAdapter } from './BaseGameAdapter'
import { WebSocketBridge } from '../bridges/WebSocketBridge'
import {
  GameInfo,
  GameCommand,
  GameCommandResult,
  GameAdapterConfig
} from '../types'

/**
 * GTAAdapter - Grand Theft Auto V (FiveM) adapter
 * 
 * Connects to GTA V via WebSocket bridge.
 * Supports player and vehicle events.
 * 
 * Events:
 * - player.spawned, player.death
 * - player.health.changed, player.armor.changed
 * - player.money.changed, player.wanted.changed
 * - vehicle.spawned, vehicle.destroyed
 * - vehicle.entered, vehicle.exited
 * 
 * Commands:
 * - spawn.vehicle, spawn.ped
 * - teleport, set.health, set.armor
 * - give.weapon, clearwanted
 * - weather.set, time.set
 */
export class GTAAdapter extends BaseGameAdapter {
  readonly gameId = 'gta5'
  readonly gameName = 'Grand Theft Auto V'
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
      description: 'Grand Theft Auto V integration via FiveM',
      icon: '🚗',
      platform: 'pc',
      adapterVersion: this.version,
      supportedEvents: this.getSupportedEvents(),
      supportedCommands: this.getSupportedCommands()
    }
  }

  getSupportedEvents(): string[] {
    return [
      'player.spawned',
      'player.death',
      'player.health.changed',
      'player.armor.changed',
      'player.money.changed',
      'player.wanted.changed',
      'vehicle.spawned',
      'vehicle.destroyed',
      'vehicle.entered',
      'vehicle.exited',
      'vehicle.damaged',
      'weapon.fired'
    ]
  }

  getSupportedCommands(): string[] {
    return [
      'spawn.vehicle',
      'spawn.ped',
      'teleport',
      'set.health',
      'set.armor',
      'give.weapon',
      'clearwanted',
      'weather.set',
      'time.set'
    ]
  }

  protected async connectToGame(): Promise<boolean> {
    // Create WebSocket bridge
    const bridgeConfig = this.config.bridgeConfig as { host: string; port: number }
    this.bridge = new WebSocketBridge({
      host: bridgeConfig.host || 'localhost',
      port: bridgeConfig.port || 8765
    })

    // Set up message handler
    this.bridge.onMessage((data: unknown) => {
      const message = data as { event?: string; type?: string; data?: Record<string, unknown> }
      
      if (message.event || message.type) {
        this.emitGameEvent(
          message.event || message.type || 'unknown',
          message.data || {}
        )
      }
    })

    // Set up error handler
    this.bridge.onError((error: Error) => {
      this.logger.error('Bridge error', error)
    })

    // Set up close handler
    this.bridge.onClose(() => {
      this.logger.info('Bridge connection closed')
    })

    // Connect
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
