import { ipcMain } from 'electron'
import { profileHandlers } from './profile.ipc'
import { triggerHandlers } from './trigger.ipc'
import { assetHandlers } from './asset.ipc'
import { connectorHandlers } from './connector.ipc'
import { overlayHandlers } from './overlay.ipc'
import { pluginHandlers } from './plugin.ipc'
import { systemHandlers } from './system.ipc'
import { settingsHandlers } from './settings.ipc'

export function registerIpcHandlers(): void {
  // Profile handlers
  ipcMain.handle('profile:list', profileHandlers.list)
  ipcMain.handle('profile:get', profileHandlers.get)
  ipcMain.handle('profile:create', profileHandlers.create)
  ipcMain.handle('profile:update', profileHandlers.update)
  ipcMain.handle('profile:delete', profileHandlers.delete)

  // Trigger handlers
  ipcMain.handle('trigger:list', triggerHandlers.list)
  ipcMain.handle('trigger:create', triggerHandlers.create)
  ipcMain.handle('trigger:update', triggerHandlers.update)
  ipcMain.handle('trigger:delete', triggerHandlers.delete)
  ipcMain.handle('trigger:test', triggerHandlers.test)
  ipcMain.handle('trigger:toggle', triggerHandlers.toggle)

  // Asset handlers
  ipcMain.handle('asset:list', assetHandlers.list)
  ipcMain.handle('asset:import', assetHandlers.import)
  ipcMain.handle('asset:delete', assetHandlers.delete)
  ipcMain.handle('asset:scan', assetHandlers.scan)

  // Connector handlers
  ipcMain.handle('connector:connect', connectorHandlers.connect)
  ipcMain.handle('connector:disconnect', connectorHandlers.disconnect)
  ipcMain.handle('connector:status', connectorHandlers.status)
  ipcMain.handle('connector:allStatus', connectorHandlers.allStatus)
  ipcMain.handle('connector:list', connectorHandlers.list)
  ipcMain.handle('connector:getEventHistory', connectorHandlers.getEventHistory)

  // Overlay handlers
  ipcMain.handle('overlay:list', overlayHandlers.list)
  ipcMain.handle('overlay:save', overlayHandlers.save)
  ipcMain.handle('overlay:preview', overlayHandlers.preview)

  // Plugin handlers
  ipcMain.handle('plugin:list', pluginHandlers.list)
  ipcMain.handle('plugin:install', pluginHandlers.install)
  ipcMain.handle('plugin:disable', pluginHandlers.disable)
  ipcMain.handle('plugin:remove', pluginHandlers.remove)

  // System handlers
  ipcMain.handle('system:getVersion', systemHandlers.getVersion)
  ipcMain.handle('system:getStatus', systemHandlers.getStatus)
  ipcMain.handle('system:restart', systemHandlers.restart)

  // Settings handlers
  ipcMain.handle('settings:get', settingsHandlers.get)
  ipcMain.handle('settings:set', settingsHandlers.set)
  ipcMain.handle('settings:getAll', settingsHandlers.getAll)
}
