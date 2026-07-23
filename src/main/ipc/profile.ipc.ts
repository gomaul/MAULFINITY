import { IpcMainInvokeEvent } from 'electron'
import { ProfileRepository } from '@services/database/repositories/ProfileRepository'
import { v4 as uuidv4 } from 'uuid'

const profileRepo = new ProfileRepository()

export const profileHandlers = {
  async list(): Promise<unknown[]> {
    return profileRepo.findAll()
  },

  async get(_event: IpcMainInvokeEvent, id: string): Promise<unknown | null> {
    return profileRepo.findById(id)
  },

  async create(_event: IpcMainInvokeEvent, data: { name: string; description?: string }): Promise<unknown> {
    const profile = {
      id: uuidv4(),
      name: data.name,
      description: data.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    return profileRepo.create(profile)
  },

  async update(_event: IpcMainInvokeEvent, id: string, data: Record<string, unknown>): Promise<unknown> {
    return profileRepo.update(id, {
      ...data,
      updated_at: new Date().toISOString()
    })
  },

  async delete(_event: IpcMainInvokeEvent, id: string): Promise<void> {
    return profileRepo.delete(id)
  }
}
