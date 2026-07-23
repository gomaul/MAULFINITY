import { OBSService } from './OBSService'
import { Logger } from '@services/logger'

const logger = new Logger('OBSSceneManager')

export interface SceneTransition {
  name: string
  duration: number
}

/**
 * OBSSceneManager - Scene management operations
 */
export class OBSSceneManager {
  private static instance: OBSSceneManager
  private obsService: OBSService

  private constructor() {
    this.obsService = OBSService.getInstance()
  }

  static getInstance(): OBSSceneManager {
    if (!OBSSceneManager.instance) {
      OBSSceneManager.instance = new OBSSceneManager()
    }
    return OBSSceneManager.instance
  }

  /**
   * Get all scenes
   */
  async getScenes(): Promise<Array<{ name: string; isActive: boolean }>> {
    return this.obsService.getScenes()
  }

  /**
   * Switch to scene
   */
  async switchTo(sceneName: string): Promise<boolean> {
    logger.info(`Switching to scene: ${sceneName}`)
    return this.obsService.switchScene(sceneName)
  }

  /**
   * Get current scene
   */
  getCurrentScene(): string | null {
    return this.obsService.getCurrentScene()
  }

  /**
   * Create a sequence of scene switches
   */
  async executeSequence(scenes: string[], delayMs: number = 1000): Promise<void> {
    for (const scene of scenes) {
      await this.switchTo(scene)
      if (delayMs > 0 && scenes.indexOf(scene) < scenes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }
}
