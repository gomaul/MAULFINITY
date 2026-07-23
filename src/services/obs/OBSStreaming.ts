import { OBSService } from './OBSService'
import { Logger } from '@services/logger'

const logger = new Logger('OBSStreaming')

/**
 * OBSStreaming - Streaming control
 */
export class OBSStreaming {
  private static instance: OBSStreaming
  private obsService: OBSService

  private constructor() {
    this.obsService = OBSService.getInstance()
  }

  static getInstance(): OBSStreaming {
    if (!OBSStreaming.instance) {
      OBSStreaming.instance = new OBSStreaming()
    }
    return OBSStreaming.instance
  }

  async start(): Promise<boolean> {
    logger.info('Starting stream')
    return this.obsService.startStreaming()
  }

  async stop(): Promise<boolean> {
    logger.info('Stopping stream')
    return this.obsService.stopStreaming()
  }

  async toggle(): Promise<boolean> {
    return this.obsService.toggleStreaming()
  }

  isStreaming(): boolean {
    return this.obsService.isStreaming()
  }
}
