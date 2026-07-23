import { OBSService } from './OBSService'
import { Logger } from '@services/logger'

const logger = new Logger('OBSSourceManager')

/**
 * OBSSourceManager - Source visibility and property management
 */
export class OBSSourceManager {
  private static instance: OBSSourceManager
  private obsService: OBSService

  private constructor() {
    this.obsService = OBSService.getInstance()
  }

  static getInstance(): OBSSourceManager {
    if (!OBSSourceManager.instance) {
      OBSSourceManager.instance = new OBSSourceManager()
    }
    return OBSSourceManager.instance
  }

  /**
   * Show source in scene
   */
  async showSource(sceneName: string, sourceName: string): Promise<boolean> {
    logger.info(`Showing source: ${sourceName} in scene: ${sceneName}`)
    return this.obsService.setSourceVisibility(sceneName, sourceName, true)
  }

  /**
   * Hide source in scene
   */
  async hideSource(sceneName: string, sourceName: string): Promise<boolean> {
    logger.info(`Hiding source: ${sourceName} in scene: ${sceneName}`)
    return this.obsService.setSourceVisibility(sceneName, sourceName, false)
  }

  /**
   * Toggle source visibility
   */
  async toggleSource(sceneName: string, sourceName: string): Promise<boolean> {
    return this.obsService.toggleSourceVisibility(sceneName, sourceName)
  }

  /**
   * Get all sources in scene
   */
  async getSources(sceneName?: string): Promise<Array<{ name: string; type: string; enabled: boolean; visible: boolean }>> {
    return this.obsService.getSources(sceneName)
  }

  /**
   * Batch update source visibility
   */
  async batchSetVisibility(
    sceneName: string,
    sources: Array<{ name: string; visible: boolean }>
  ): Promise<void> {
    for (const source of sources) {
      await this.obsService.setSourceVisibility(sceneName, source.name, source.visible)
    }
  }

  /**
   * Hide all sources in scene
   */
  async hideAllSources(sceneName: string): Promise<void> {
    const sources = await this.getSources(sceneName)
    for (const source of sources) {
      await this.hideSource(sceneName, source.name)
    }
  }
}
