import { IpcMainInvokeEvent } from 'electron'
import { TriggerRepository } from '@services/database/repositories/TriggerRepository'
import { v4 as uuidv4 } from 'uuid'

const triggerRepo = new TriggerRepository()

export const triggerHandlers = {
  async list(_event: IpcMainInvokeEvent, profileId: string): Promise<unknown[]> {
    return triggerRepo.findByProfileId(profileId)
  },

  async create(_event: IpcMainInvokeEvent, data: {
    profile_id: string
    name: string
    event_type: string
    condition_json: string
    actions_json: string
  }): Promise<unknown> {
    const trigger = {
      id: uuidv4(),
      ...data,
      enabled: 1,
      created_at: new Date().toISOString()
    }
    return triggerRepo.create(trigger)
  },

  async update(_event: IpcMainInvokeEvent, id: string, data: Record<string, unknown>): Promise<unknown> {
    return triggerRepo.update(id, data)
  },

  async delete(_event: IpcMainInvokeEvent, id: string): Promise<void> {
    return triggerRepo.delete(id)
  },

  async test(_event: IpcMainInvokeEvent, id: string): Promise<boolean> {
    // TODO: Implement trigger testing
    console.log('Testing trigger:', id)
    return true
  },

  async toggle(_event: IpcMainInvokeEvent, id: string): Promise<unknown> {
    return triggerRepo.toggleEnabled(id)
  }
}
