import { Action } from '../ActionEngine'
import { MaulfinityEvent } from '@core/event-bus/types'
import { Logger } from '@services/logger'

const logger = new Logger('KeyboardAction')

/**
 * KeyboardAction - Simulates keyboard input
 *
 * Config:
 *   key: string - The key to press (e.g., 'F10', 'a', 'Enter')
 *   modifiers: string[] - Optional modifiers (e.g., ['Ctrl', 'Shift'])
 *   mode: 'press' | 'tap' | 'hold' - Default: 'tap'
 *   holdDuration: number - Duration in ms for 'hold' mode (default: 100)
 */
export class KeyboardAction implements Action {
  name = 'keyboard'

  validate(config: Record<string, unknown>): boolean {
    if (!config.key || typeof config.key !== 'string') {
      logger.error('KeyboardAction: key is required and must be a string')
      return false
    }
    if (config.modifiers && !Array.isArray(config.modifiers)) {
      logger.error('KeyboardAction: modifiers must be an array')
      return false
    }
    return true
  }

  async execute(config: Record<string, unknown>, _event: MaulfinityEvent): Promise<void> {
    const key = config.key as string
    const modifiers = (config.modifiers as string[]) || []
    const mode = (config.mode as string) || 'tap'
    const holdDuration = (config.holdDuration as number) || 100

    // Build the key combination string
    const keyCombo = modifiers.length > 0
      ? `${modifiers.join('+')}+${key}`
      : key

    logger.info(`Executing keyboard: ${keyCombo} in ${mode} mode`)

    // Placeholder for actual keyboard simulation
    // In production, this would use:
    // - robotjs for native keyboard simulation
    // - or Electron's globalShortcut for registered shortcuts
    switch (mode) {
      case 'press':
        logger.info(`Pressing and holding: ${keyCombo} for ${holdDuration}ms`)
        break
      case 'hold':
        logger.info(`Holding: ${keyCombo} for ${holdDuration}ms`)
        await new Promise(resolve => setTimeout(resolve, holdDuration))
        break
      case 'tap':
      default:
        logger.info(`Tapping: ${keyCombo}`)
        break
    }

    logger.info(`KeyboardAction completed: ${keyCombo}`)
  }

  settings(): Record<string, unknown> {
    return {
      key: { type: 'string', required: true, label: 'Key' },
      modifiers: { type: 'array', items: 'string', label: 'Modifiers' },
      mode: { type: 'select', options: ['press', 'tap', 'hold'], default: 'tap', label: 'Mode' },
      holdDuration: { type: 'number', default: 100, min: 10, max: 5000, label: 'Hold Duration (ms)' }
    }
  }
}
