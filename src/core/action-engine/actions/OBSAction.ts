import { Action } from '../ActionEngine'
import { MaulfinityEvent } from '@core/event-bus/types'
import { Logger } from '@services/logger'

const logger = new Logger('OBSAction')

export type OBSActionType = 'switchScene' | 'showSource' | 'hideSource' | 'toggleSource' | 'startRecording' | 'stopRecording' | 'startStreaming' | 'stopStreaming'

/**
 * OBSAction - OBS integration actions
 * 
 * Supports:
 * - OBS Change Scene
 * - OBS Show Source
 * - OBS Hide Source
 * - OBS Start Recording
 * - OBS Stop Recording
 * - OBS Start Streaming
 * - OBS Stop Streaming
 */
export class OBSAction implements Action {
  name = 'obs'

  validate(config: Record<string, unknown>): boolean {
    if (!config.action || typeof config.action !== 'string') {
      logger.error('OBSAction: action is required and must be a string')
      return false
    }

    const validActions: OBSActionType[] = [
      'switchScene', 'showSource', 'hideSource', 'toggleSource',
      'startRecording', 'stopRecording', 'startStreaming', 'stopStreaming'
    ]

    if (!validActions.includes(config.action as OBSActionType)) {
      logger.error(`OBSAction: invalid action type: ${config.action}`)
      return false
    }

    return true
  }

  async execute(config: Record<string, unknown>, _event: MaulfinityEvent): Promise<void> {
    const action = config.action as OBSActionType

    logger.info(`Executing OBS action: ${action}`)

    // Import OBS service dynamically to avoid circular dependencies
    const { OBSService } = await import('@services/obs/OBSService')
    const obsService = OBSService.getInstance()

    switch (action) {
      case 'switchScene':
        if (!config.scene || typeof config.scene !== 'string') {
          logger.error('OBSAction: scene is required for switchScene')
          return
        }
        await obsService.switchScene(config.scene as string)
        break

      case 'showSource':
        if (!config.scene || !config.source) {
          logger.error('OBSAction: scene and source are required for showSource')
          return
        }
        await obsService.setSourceVisibility(config.scene as string, config.source as string, true)
        break

      case 'hideSource':
        if (!config.scene || !config.source) {
          logger.error('OBSAction: scene and source are required for hideSource')
          return
        }
        await obsService.setSourceVisibility(config.scene as string, config.source as string, false)
        break

      case 'toggleSource':
        if (!config.scene || !config.source) {
          logger.error('OBSAction: scene and source are required for toggleSource')
          return
        }
        await obsService.toggleSourceVisibility(config.scene as string, config.source as string)
        break

      case 'startRecording':
        await obsService.startRecording()
        break

      case 'stopRecording':
        await obsService.stopRecording()
        break

      case 'startStreaming':
        await obsService.startStreaming()
        break

      case 'stopStreaming':
        await obsService.stopStreaming()
        break

      default:
        logger.warning(`OBSAction: unknown action: ${action}`)
    }

    logger.info(`OBS action completed: ${action}`)
  }

  settings(): Record<string, unknown> {
    return {
      action: {
        type: 'select',
        options: [
          'switchScene',
          'showSource',
          'hideSource',
          'toggleSource',
          'startRecording',
          'stopRecording',
          'startStreaming',
          'stopStreaming'
        ],
        required: true,
        label: 'Action'
      },
      scene: {
        type: 'string',
        label: 'Scene Name',
        placeholder: 'Enter scene name'
      },
      source: {
        type: 'string',
        label: 'Source Name',
        placeholder: 'Enter source name'
      }
    }
  }
}
