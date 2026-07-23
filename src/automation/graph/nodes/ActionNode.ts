import { BaseNode } from './BaseNode'
import { NodeCategory, NodePortDefinition, ConfigSchema, NodeOutput, ExecutionContext } from '../types'

/**
 * ActionNode - Base class for action execution nodes
 *
 * Action nodes call the ActionEngine to perform side effects
 * (keyboard, OBS, sound, TTS, overlay, etc.)
 */
export abstract class ActionNode extends BaseNode {
  readonly category: NodeCategory = 'action'

  getInputs(): NodePortDefinition[] {
    return [
      { name: 'input', type: 'signal', required: true, label: 'Input' }
    ]
  }

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'signal', type: 'signal', required: false, label: 'Output' }
    ]
  }

  /**
   * Execute the action via ActionEngine
   */
  protected async dispatchAction(
    actionType: string,
    config: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<void> {
    try {
      const { ActionEngine } = await import('@core/action-engine/ActionEngine')
      const engine = ActionEngine.getInstance()
      await engine.execute(actionType, config, context.triggerEvent)
    } catch (error) {
      this.logger.error(`Failed to dispatch action: ${actionType}`, error as Error)
      throw error
    }
  }
}

// ============================================================
// CONCRETE ACTION NODES
// ============================================================

/** Keyboard Action Node */
export class KeyboardActionNode extends ActionNode {
  readonly type = 'action:keyboard'
  readonly name = 'Keyboard'
  readonly description = 'Simulate a keyboard press'
  readonly icon = '⌨️'
  readonly color = '#3b82f6'

  getConfigSchema(): ConfigSchema {
    return {
      key: { type: 'string', label: 'Key', required: true, placeholder: 'F10' },
      modifiers: { type: 'string', label: 'Modifiers (comma-separated)', placeholder: 'Ctrl,Shift' },
      mode: {
        type: 'select',
        label: 'Mode',
        default: 'tap',
        options: [
          { label: 'Tap', value: 'tap' },
          { label: 'Press', value: 'press' },
          { label: 'Hold', value: 'hold' }
        ]
      },
      holdDuration: { type: 'number', label: 'Hold Duration (ms)', default: 100, min: 10, max: 5000 }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.key === 'string' && config.key.length > 0
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const modifiers = config.modifiers
      ? (config.modifiers as string).split(',').map(m => m.trim()).filter(Boolean)
      : []

    await this.dispatchAction('keyboard', {
      key: config.key,
      modifiers,
      mode: config.mode || 'tap',
      holdDuration: config.holdDuration || 100
    }, context)

    return this.success('signal', { key: config.key, modifiers })
  }
}

/** OBS Action Node */
export class OBSActionNode extends ActionNode {
  readonly type = 'action:obs'
  readonly name = 'OBS'
  readonly description = 'Control OBS Studio'
  readonly icon = '📺'
  readonly color = '#3b82f6'

  getConfigSchema(): ConfigSchema {
    return {
      action: {
        type: 'select',
        label: 'OBS Action',
        required: true,
        default: 'switchScene',
        options: [
          { label: 'Switch Scene', value: 'switchScene' },
          { label: 'Show Source', value: 'showSource' },
          { label: 'Hide Source', value: 'hideSource' },
          { label: 'Start Recording', value: 'startRecording' },
          { label: 'Stop Recording', value: 'stopRecording' },
          { label: 'Start Streaming', value: 'startStreaming' },
          { label: 'Stop Streaming', value: 'stopStreaming' }
        ]
      },
      scene: { type: 'string', label: 'Scene Name', placeholder: 'Enter scene name' },
      source: { type: 'string', label: 'Source Name', placeholder: 'Enter source name' }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.action === 'string' && config.action.length > 0
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    await this.dispatchAction('obs', {
      action: config.action,
      scene: config.scene,
      source: config.source
    }, context)

    return this.success('signal', { obsAction: config.action })
  }
}

/** Sound Action Node */
export class SoundActionNode extends ActionNode {
  readonly type = 'action:sound'
  readonly name = 'Sound'
  readonly description = 'Play an audio file'
  readonly icon = '🔊'
  readonly color = '#3b82f6'

  getConfigSchema(): ConfigSchema {
    return {
      file: { type: 'string', label: 'Audio File Path', required: true, placeholder: '/path/to/sound.mp3' },
      volume: { type: 'number', label: 'Volume (%)', default: 80, min: 0, max: 100 },
      loop: { type: 'boolean', label: 'Loop', default: false }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.file === 'string' && config.file.length > 0
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    await this.dispatchAction('sound', {
      file: config.file,
      volume: config.volume || 80,
      loop: config.loop || false
    }, context)

    return this.success('signal', { file: config.file })
  }
}

/** TTS Action Node */
export class TTSActionNode extends ActionNode {
  readonly type = 'action:tts'
  readonly name = 'TTS'
  readonly description = 'Text-to-speech'
  readonly icon = '🗣️'
  readonly color = '#3b82f6'

  getConfigSchema(): ConfigSchema {
    return {
      text: { type: 'textarea', label: 'Text (supports {{event.user}})', required: true, placeholder: 'Hello {{event.user}}!' },
      voice: {
        type: 'select',
        label: 'Voice',
        default: 'default',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' }
        ]
      },
      volume: { type: 'number', label: 'Volume (%)', default: 80, min: 0, max: 100 },
      speed: { type: 'number', label: 'Speed', default: 1.0, min: 0.5, max: 2.0, step: 0.1 }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.text === 'string' && config.text.length > 0
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    await this.dispatchAction('tts', {
      text: config.text,
      voice: config.voice || 'default',
      volume: config.volume || 80,
      speed: config.speed || 1.0
    }, context)

    return this.success('signal', { text: config.text })
  }
}

/** Overlay Action Node */
export class OverlayActionNode extends ActionNode {
  readonly type = 'action:overlay'
  readonly name = 'Overlay'
  readonly description = 'Show an overlay animation'
  readonly icon = '🎨'
  readonly color = '#3b82f6'

  getConfigSchema(): ConfigSchema {
    return {
      overlayId: { type: 'string', label: 'Overlay ID', required: true, placeholder: 'gift-alert' },
      animation: { type: 'string', label: 'Animation', placeholder: 'bounce' }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.overlayId === 'string' && config.overlayId.length > 0
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    await this.dispatchAction('overlay', {
      overlayId: config.overlayId,
      animation: config.animation
    }, context)

    return this.success('signal', { overlayId: config.overlayId })
  }
}

/** WebSocket Action Node */
export class WebSocketActionNode extends ActionNode {
  readonly type = 'action:websocket'
  readonly name = 'WebSocket'
  readonly description = 'Send data via WebSocket'
  readonly icon = '🔌'
  readonly color = '#3b82f6'

  getConfigSchema(): ConfigSchema {
    return {
      url: { type: 'string', label: 'WebSocket URL', required: true, placeholder: 'ws://localhost:8765' },
      message: { type: 'string', label: 'Message (JSON)', required: true, placeholder: '{"event":"spawn","data":{}}' }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.url === 'string' && config.url.length > 0
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    let messageData: Record<string, unknown> = {}
    try {
      messageData = JSON.parse(config.message as string)
    } catch {
      messageData = { raw: config.message }
    }

    await this.dispatchAction('websocket', {
      url: config.url,
      data: messageData
    }, context)

    return this.success('signal', { url: config.url })
  }
}

/** Game Command Action Node */
export class GameCommandActionNode extends ActionNode {
  readonly type = 'action:game'
  readonly name = 'Game Command'
  readonly description = 'Send a command to a connected game'
  readonly icon = '🎮'
  readonly color = '#3b82f6'

  getConfigSchema(): ConfigSchema {
    return {
      gameId: { type: 'string', label: 'Game ID', required: true, placeholder: 'gta-v' },
      action: { type: 'string', label: 'Command', required: true, placeholder: 'spawn.vehicle' },
      params: { type: 'string', label: 'Parameters (JSON)', placeholder: '{"model":"adder"}' }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.gameId === 'string' && typeof config.action === 'string'
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    let params: Record<string, unknown> = {}
    try {
      params = JSON.parse(config.params as string || '{}')
    } catch {
      params = {}
    }

    await this.dispatchAction('game', {
      gameId: config.gameId,
      action: config.action,
      params
    }, context)

    return this.success('signal', { gameId: config.gameId, action: config.action })
  }
}

/** Delay Action Node */
export class DelayActionNode extends ActionNode {
  readonly type = 'action:delay'
  readonly name = 'Wait'
  readonly description = 'Wait for a specified duration'
  readonly icon = '⏱️'
  readonly color = '#06b6d4'

  getInputs(): NodePortDefinition[] {
    return [
      { name: 'input', type: 'signal', required: true, label: 'Input' }
    ]
  }

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'output', type: 'signal', required: false, label: 'Output' }
    ]
  }

  getConfigSchema(): ConfigSchema {
    return {
      seconds: { type: 'number', label: 'Wait (seconds)', required: true, default: 1, min: 0.1, max: 300, step: 0.1 }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.seconds === 'number' && (config.seconds as number) > 0
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const seconds = this.getConfig<number>(config, 'seconds', 1)
    this.logger.debug(`Waiting ${seconds} seconds...`)
    await new Promise(resolve => setTimeout(resolve, seconds * 1000))
    return this.success('output', { waited: seconds })
  }
}
