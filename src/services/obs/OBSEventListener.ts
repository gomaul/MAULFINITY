import { OBSService } from './OBSService'
import { Logger } from '@services/logger'

const logger = new Logger('OBSEventListener')

/**
 * OBSEventListener - Normalizes OBS events to MaulfinityEvent
 * 
 * Responsibilities:
 * - Listen to OBSService events
 * - Normalize to MaulfinityEvent format
 * - Emit to EventBus
 */
export class OBSEventListener {
  private static instance: OBSEventListener
  private obsService: OBSService
  private eventBus: unknown

  private constructor() {
    this.obsService = OBSService.getInstance()
  }

  static getInstance(): OBSEventListener {
    if (!OBSEventListener.instance) {
      OBSEventListener.instance = new OBSEventListener()
    }
    return OBSEventListener.instance
  }

  /**
   * Initialize event listeners
   */
  initialize(): void {
    // Listen to OBS events
    this.obsService.on('sceneSwitched', (sceneName: string) => {
      this.emitEvent('obs:sceneSwitch', { scene: sceneName })
    })

    this.obsService.on('recordingStateChanged', (isRecording: boolean) => {
      this.emitEvent('obs:recording', { active: isRecording })
    })

    this.obsService.on('streamingStateChanged', (isStreaming: boolean) => {
      this.emitEvent('obs:streaming', { active: isStreaming })
    })

    logger.info('OBS Event Listener initialized')
  }

  /**
   * Emit normalized event
   */
  private emitEvent(type: string, data: Record<string, unknown>): void {
    // Will be wired to EventBus
    logger.debug(`OBS Event: ${type}`, data)
  }
}
