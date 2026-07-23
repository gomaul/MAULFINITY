import { BaseGameAdapter } from './BaseGameAdapter'
import { WebSocketBridge } from '../bridges/WebSocketBridge'
import {
  GameInfo,
  GameCommand,
  GameCommandResult,
  GameAdapterConfig
} from '../types'

/**
 * CustomAdapter - Generic adapter for custom game integrations
 * 
 * Use this adapter for games not specifically supported.
 * Provides basic event forwarding and command execution.
 */
export class CustomAdapter extends BaseGameAdapter {
  readonly gameId: string
  readonly gameName: string
  readonly version = '1.0.0'
  readonly author = 'User'

  private customEvents: string[] = []
  private customCommands: string[] = []

  constructor(gameId: string, config: GameAdapterConfig) {
    super(gameId, config)
    this.gameId = gameId
    this.gameName = (config.customSettings?.gameName as string) || 'Custom Game'
    this.customEvents = (config.customSettings?.events as string[]) || []
    this.customCommands = (config.customSettings?.commands as string[]) || []
  }

  getGameInfo(): GameInfo {
    return {
      id: this.gameId,
      name: this.gameName,
      version: '1.0.0',
      description: (this.config.customSettings?.description as string) || 'Custom game integration',
      icon: '🎯',
      platform: 'pc',
      adapterVersion: this.version,
      supportedEvents: this.getSupportedEvents(),
      supportedCommands: this.getSupportedCommands()
    }
  }

  getSupportedEvents(): string[] {
    return this.customEvents.length > 0
      ? this.customEvents
      : ['custom.event']
  }

  getSupportedCommands(): string[] {
    return this.customCommands.length > 0
      ? this.customCommands
      : ['custom.command']
  }

  protected async connectToGame(): Promise<boolean> {
    const bridgeConfig = this.config.bridgeConfig as { host: string; port: number }
    this.bridge = new WebSocketBridge({
      host: bridgeConfig.host || 'localhost',
      port: bridgeConfig.port || 8767
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
