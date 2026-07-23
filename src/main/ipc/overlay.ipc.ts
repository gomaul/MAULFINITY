import { IpcMainInvokeEvent } from 'electron'
import { OverlayRepository } from '@services/database/repositories/OverlayRepository'
import { v4 as uuidv4 } from 'uuid'
import { Logger } from '@services/logger'

const logger = new Logger('OverlayIPC')
const overlayRepo = new OverlayRepository()

export const overlayHandlers = {
  async list(_event: IpcMainInvokeEvent, profileId: string): Promise<unknown[]> {
    return overlayRepo.findByProfileId(profileId)
  },

  async save(_event: IpcMainInvokeEvent, data: {
    profile_id: string
    name: string
    scene_json: string
  }): Promise<unknown> {
    const overlay = {
      id: uuidv4(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    logger.info(`Saving overlay: ${data.name}`)
    return overlayRepo.create(overlay)
  },

  async preview(_event: IpcMainInvokeEvent, id: string): Promise<string> {
    logger.info(`Previewing overlay: ${id}`)
    // TODO: Generate preview URL
    return `http://localhost:8765/overlay/${id}`
  }
}
