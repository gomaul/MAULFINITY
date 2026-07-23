import { IpcMainInvokeEvent } from 'electron'
import { OverlayRuntime } from '@overlay/runtime/OverlayRuntime'
import { OverlayAnimationEngine } from '@overlay/runtime/OverlayAnimation'
import { Logger } from '@services/logger'

const logger = new Logger('OverlayRuntimeIPC')
const overlayRuntime = OverlayRuntime.getInstance()
const animationEngine = OverlayAnimationEngine.getInstance()

export const overlayRuntimeHandlers = {
  /**
   * Get current scene
   */
  async getCurrentScene(_event: IpcMainInvokeEvent): Promise<unknown> {
    return overlayRuntime.getCurrentScene()
  },

  /**
   * Set current scene
   */
  async setCurrentScene(_event: IpcMainInvokeEvent, sceneId: string): Promise<void> {
    overlayRuntime.setCurrentScene(sceneId)
  },

  /**
   * Reload scene
   */
  async reloadScene(_event: IpcMainInvokeEvent, sceneId: string): Promise<void> {
    overlayRuntime.reloadScene(sceneId)
  },

  /**
   * Get objects
   */
  async getObjects(_event: IpcMainInvokeEvent): Promise<unknown[]> {
    return overlayRuntime.getObjects()
  },

  /**
   * Set object visibility
   */
  async setObjectVisibility(_event: IpcMainInvokeEvent, objectId: string, visible: boolean): Promise<void> {
    overlayRuntime.setObjectVisibility(objectId, visible)
  },

  /**
   * Start animation
   */
  async startAnimation(
    _event: IpcMainInvokeEvent,
    objectId: string,
    animation: { type: string; duration: number; easing?: string }
  ): Promise<void> {
    animationEngine.startAnimation(objectId, animation)
  },

  /**
   * Stop animation
   */
  async stopAnimation(_event: IpcMainInvokeEvent, objectId: string): Promise<void> {
    animationEngine.stopAnimation(objectId)
  },

  /**
   * Start rendering
   */
  async startRendering(_event: IpcMainInvokeEvent): Promise<void> {
    overlayRuntime.startRendering()
  },

  /**
   * Stop rendering
   */
  async stopRendering(_event: IpcMainInvokeEvent): Promise<void> {
    overlayRuntime.stopRendering()
  }
}
