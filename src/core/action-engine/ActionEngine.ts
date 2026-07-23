import { ActionRegistry } from './ActionRegistry'
import { MaulfinityEvent } from '../event-bus/types'
import { Logger } from '@services/logger'
import { KeyboardAction } from './actions/KeyboardAction'
import { SoundAction } from './actions/SoundAction'
import { WebsocketAction } from './actions/WebsocketAction'
import { TtsAction } from './actions/TtsAction'
import { OverlayAction } from './actions/OverlayAction'
import { OBSAction } from './actions/OBSAction'
import { GameCommandAction } from './actions/GameCommandAction'

const logger = new Logger('ActionEngine')

export interface Action {
  name: string
  validate(config: Record<string, unknown>): boolean
  execute(config: Record<string, unknown>, event: MaulfinityEvent): Promise<void>
  settings(): Record<string, unknown>
}

export class ActionEngine {
  private registry: ActionRegistry
  private static instance: ActionEngine

  constructor() {
    this.registry = new ActionRegistry()
    this.registerBuiltInActions()
  }

  static getInstance(): ActionEngine {
    if (!ActionEngine.instance) {
      ActionEngine.instance = new ActionEngine()
    }
    return ActionEngine.instance
  }

  private registerBuiltInActions(): void {
    this.registry.register('keyboard', new KeyboardAction())
    this.registry.register('sound', new SoundAction())
    this.registry.register('websocket', new WebsocketAction())
    this.registry.register('tts', new TtsAction())
    this.registry.register('overlay', new OverlayAction())
    this.registry.register('obs', new OBSAction())
    this.registry.register('game', new GameCommandAction())
    logger.info('Action engine initialized with built-in actions: keyboard, sound, websocket, tts, overlay, obs, game')
  }

  /**
   * Execute an action by type
   */
  async execute(
    actionType: string,
    config: Record<string, unknown>,
    event: MaulfinityEvent
  ): Promise<void> {
    const action = this.registry.get(actionType)

    if (!action) {
      logger.warning(`Action not found: ${actionType}`)
      return
    }

    // Validate config
    if (!action.validate(config)) {
      logger.error(`Invalid config for action: ${actionType}`)
      return
    }

    // Execute
    await action.execute(config, event)
  }

  /**
   * Register a custom action
   */
  registerAction(type: string, action: Action): void {
    this.registry.register(type, action)
    logger.info(`Registered action: ${type}`)
  }

  /**
   * Get all registered action types
   */
  getRegisteredTypes(): string[] {
    return this.registry.getTypes()
  }

  /**
   * Check if an action type is registered
   */
  hasAction(type: string): boolean {
    return this.registry.has(type)
  }
}
