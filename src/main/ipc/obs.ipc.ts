import { IpcMainInvokeEvent } from 'electron'
import { OBSService } from '@services/obs/OBSService'
import { Logger } from '@services/logger'

const logger = new Logger('OBSIPC')
const obsService = OBSService.getInstance()

export const obsHandlers = {
  /**
   * Connect to OBS
   */
  async connect(_event: IpcMainInvokeEvent, config?: { host?: string; port?: number; password?: string }): Promise<boolean> {
    try {
      if (config) {
        obsService.configure(config)
      }
      return await obsService.connect()
    } catch (error) {
      logger.error('Failed to connect to OBS', error as Error)
      return false
    }
  },

  /**
   * Disconnect from OBS
   */
  async disconnect(_event: IpcMainInvokeEvent): Promise<void> {
    await obsService.disconnect()
  },

  /**
   * Get connection status
   */
  async status(_event: IpcMainInvokeEvent): Promise<{ status: string; state: unknown }> {
    return {
      status: obsService.getStatus(),
      state: obsService.getState()
    }
  },

  /**
   * Get all scenes
   */
  async getScenes(_event: IpcMainInvokeEvent): Promise<unknown[]> {
    return obsService.getScenes()
  },

  /**
   * Switch scene
   */
  async switchScene(_event: IpcMainInvokeEvent, sceneName: string): Promise<boolean> {
    return obsService.switchScene(sceneName)
  },

  /**
   * Get sources in scene
   */
  async getSources(_event: IpcMainInvokeEvent, sceneName?: string): Promise<unknown[]> {
    return obsService.getSources(sceneName)
  },

  /**
   * Set source visibility
   */
  async setSourceVisibility(_event: IpcMainInvokeEvent, sceneName: string, sourceName: string, visible: boolean): Promise<boolean> {
    return obsService.setSourceVisibility(sceneName, sourceName, visible)
  },

  /**
   * Start recording
   */
  async startRecording(_event: IpcMainInvokeEvent): Promise<boolean> {
    return obsService.startRecording()
  },

  /**
   * Stop recording
   */
  async stopRecording(_event: IpcMainInvokeEvent): Promise<boolean> {
    return obsService.stopRecording()
  },

  /**
   * Toggle recording
   */
  async toggleRecording(_event: IpcMainInvokeEvent): Promise<boolean> {
    return obsService.toggleRecording()
  },

  /**
   * Start streaming
   */
  async startStreaming(_event: IpcMainInvokeEvent): Promise<boolean> {
    return obsService.startStreaming()
  },

  /**
   * Stop streaming
   */
  async stopStreaming(_event: IpcMainInvokeEvent): Promise<boolean> {
    return obsService.stopStreaming()
  },

  /**
   * Toggle streaming
   */
  async toggleStreaming(_event: IpcMainInvokeEvent): Promise<boolean> {
    return obsService.toggleStreaming()
  },

  /**
   * Get OBS stats
   */
  async getStats(_event: IpcMainInvokeEvent): Promise<unknown> {
    return obsService.getStats()
  }
}
