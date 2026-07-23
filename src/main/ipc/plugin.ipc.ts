import { IpcMainInvokeEvent } from 'electron'
import { PluginRepository } from '@services/database/repositories/PluginRepository'
import { v4 as uuidv4 } from 'uuid'
import { Logger } from '@services/logger'

const logger = new Logger('PluginIPC')
const pluginRepo = new PluginRepository()

export const pluginHandlers = {
  async list(): Promise<unknown[]> {
    return pluginRepo.findAll()
  },

  async install(_event: IpcMainInvokeEvent, path: string): Promise<unknown> {
    logger.info(`Installing plugin from: ${path}`)
    // TODO: Implement plugin installation logic
    const plugin = {
      id: uuidv4(),
      name: 'Unknown Plugin',
      version: '1.0.0',
      enabled: 1,
      permissions_json: '[]',
      path
    }
    return pluginRepo.create(plugin)
  },

  async disable(_event: IpcMainInvokeEvent, id: string): Promise<void> {
    logger.info(`Disabling plugin: ${id}`)
    pluginRepo.toggleEnabled(id)
  },

  async remove(_event: IpcMainInvokeEvent, id: string): Promise<void> {
    logger.info(`Removing plugin: ${id}`)
    pluginRepo.delete(id)
  }
}
