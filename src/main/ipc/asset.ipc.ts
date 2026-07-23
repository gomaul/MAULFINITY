import { IpcMainInvokeEvent } from 'electron'
import { AssetRepository } from '@services/database/repositories/AssetRepository'
import { v4 as uuidv4 } from 'uuid'

const assetRepo = new AssetRepository()

export const assetHandlers = {
  async list(): Promise<unknown[]> {
    return assetRepo.findAll()
  },

  async import(_event: IpcMainInvokeEvent, data: {
    name: string
    type: string
    path: string
    category?: string
  }): Promise<unknown> {
    const asset = {
      id: uuidv4(),
      name: data.name,
      type: data.type,
      path: data.path,
      category: data.category || null,
      created_at: new Date().toISOString()
    }
    return assetRepo.create(asset)
  },

  async delete(_event: IpcMainInvokeEvent, id: string): Promise<void> {
    return assetRepo.delete(id)
  }
}
