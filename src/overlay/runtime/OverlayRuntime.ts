import { EventEmitter } from 'events'
import { Logger } from '@services/logger'

const logger = new Logger('OverlayRuntime')

export interface OverlayScene {
  id: string
  name: string
  objects: OverlayObject[]
  settings: OverlaySettings
}

export interface OverlaySettings {
  width: number
  height: number
  backgroundColor?: string
  backgroundOpacity?: number
}

export interface OverlayObject {
  id: string
  type: OverlayObjectType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  zIndex: number
  config: Record<string, unknown>
  animation?: OverlayAnimation
}

export type OverlayObjectType = 'image' | 'text' | 'video' | 'gif' | 'audio' | 'progress' | 'counter' | 'avatar' | 'queue' | 'alert' | 'container'

export interface OverlayAnimation {
  type: string
  duration: number
  delay?: number
  loop?: boolean
  easing?: string
}

/**
 * OverlayRuntime - Runtime for rendering overlays
 */
export class OverlayRuntime extends EventEmitter {
  private static instance: OverlayRuntime
  private currentScene: OverlayScene | null = null
  private loadedScenes: Map<string, OverlayScene> = new Map()
  private isRendering = false
  private animationFrameId: number | null = null

  private constructor() {
    super()
  }

  static getInstance(): OverlayRuntime {
    if (!OverlayRuntime.instance) {
      OverlayRuntime.instance = new OverlayRuntime()
    }
    return OverlayRuntime.instance
  }

  /**
   * Load a scene
   */
  loadScene(scene: OverlayScene): void {
    this.loadedScenes.set(scene.id, scene)
    logger.info(`Loaded scene: ${scene.name}`)
  }

  /**
   * Set current scene
   */
  setCurrentScene(sceneId: string): void {
    const scene = this.loadedScenes.get(sceneId)
    if (scene) {
      this.currentScene = scene
      this.emit('sceneChanged', scene)
      logger.info(`Current scene: ${scene.name}`)
    }
  }

  /**
   * Get current scene
   */
  getCurrentScene(): OverlayScene | null {
    return this.currentScene
  }

  /**
   * Reload scene
   */
  reloadScene(sceneId: string): void {
    this.emit('sceneReload', sceneId)
  }

  /**
   * Update object visibility
   */
  setObjectVisibility(objectId: string, visible: boolean): void {
    if (this.currentScene) {
      const obj = this.currentScene.objects.find(o => o.id === objectId)
      if (obj) {
        obj.visible = visible
        this.emit('objectChanged', obj)
      }
    }
  }

  /**
   * Get all objects
   */
  getObjects(): OverlayObject[] {
    return this.currentScene?.objects || []
  }

  /**
   * Start rendering loop
   */
  startRendering(): void {
    this.isRendering = true
    this.render()
  }

  /**
   * Stop rendering loop
   */
  stopRendering(): void {
    this.isRendering = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Render loop
   */
  private render(): void {
    if (!this.isRendering) return
    this.emit('render', this.currentScene)
    this.animationFrameId = requestAnimationFrame(() => this.render())
  }

  /**
   * Shutdown
   */
  shutdown(): void {
    this.stopRendering()
    this.loadedScenes.clear()
    this.currentScene = null
    logger.info('Overlay runtime shutdown')
  }
}
