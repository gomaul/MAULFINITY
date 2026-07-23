import { OBSService } from './OBSService'
import { Logger } from '@services/logger'

const logger = new Logger('OBSRecording')

/**
 * OBSRecording - Recording control
 */
export class OBSRecording {
  private static instance: OBSRecording
  private obsService: OBSService

  private constructor() {
    this.obsService = OBSService.getInstance()
  }

  static getInstance(): OBSRecording {
    if (!OBSRecording.instance) {
      OBSRecording.instance = new OBSRecording()
    }
    return OBSRecording.instance
  }

  async start(): Promise<boolean> {
    logger.info('Starting recording')
    return this.obsService.startRecording()
  }

  async stop(): Promise<boolean> {
    logger.info('Stopping recording')
    return this.obsService.stopRecording()
  }

  async toggle(): Promise<boolean> {
    return this.obsService.toggleRecording()
  }

  isRecording(): boolean {
    return this.obsService.isRecording()
  }
}
