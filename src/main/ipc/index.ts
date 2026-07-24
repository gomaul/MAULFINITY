import { ipcMain } from 'electron'
import { profileHandlers } from './profile.ipc'
import { triggerHandlers } from './trigger.ipc'
import { automationHandlers } from './automation.ipc'
import { assetHandlers } from './asset.ipc'
import { connectorHandlers } from './connector.ipc'
import { overlayHandlers } from './overlay.ipc'
import { systemHandlers } from './system.ipc'
import { settingsHandlers } from './settings.ipc'
import { obsHandlers } from './obs.ipc'
import { overlayRuntimeHandlers } from './overlay-runtime.ipc'
import { overlayEditorHandlers } from './overlay-editor.ipc'
import { registerGameIpc } from './game.ipc'
import { registerPluginIpc } from './plugin.ipc'
import { registerGraphIpc } from './graph.ipc'

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

  // Automation handlers
  ipcMain.handle('automation:list', automationHandlers.list)
  ipcMain.handle('automation:get', automationHandlers.get)
  ipcMain.handle('automation:create', automationHandlers.create)
  ipcMain.handle('automation:update', automationHandlers.update)
  ipcMain.handle('automation:delete', automationHandlers.delete)
  ipcMain.handle('automation:toggle', automationHandlers.toggle)
  ipcMain.handle('automation:test', automationHandlers.test)
  ipcMain.handle('automation:execute', automationHandlers.execute)
  ipcMain.handle('automation:getHistory', automationHandlers.getHistory)
  ipcMain.handle('automation:getStats', automationHandlers.getStats)

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

  // System handlers
  ipcMain.handle('system:getVersion', systemHandlers.getVersion)
  ipcMain.handle('system:getStatus', systemHandlers.getStatus)
  ipcMain.handle('system:restart', systemHandlers.restart)

  // Settings handlers
  ipcMain.handle('settings:get', settingsHandlers.get)
  ipcMain.handle('settings:set', settingsHandlers.set)
  ipcMain.handle('settings:getAll', settingsHandlers.getAll)

  // OBS handlers
  ipcMain.handle('obs:connect', obsHandlers.connect)
  ipcMain.handle('obs:disconnect', obsHandlers.disconnect)
  ipcMain.handle('obs:status', obsHandlers.status)
  ipcMain.handle('obs:getScenes', obsHandlers.getScenes)
  ipcMain.handle('obs:switchScene', obsHandlers.switchScene)
  ipcMain.handle('obs:getSources', obsHandlers.getSources)
  ipcMain.handle('obs:setSourceVisibility', obsHandlers.setSourceVisibility)
  ipcMain.handle('obs:startRecording', obsHandlers.startRecording)
  ipcMain.handle('obs:stopRecording', obsHandlers.stopRecording)
  ipcMain.handle('obs:toggleRecording', obsHandlers.toggleRecording)
  ipcMain.handle('obs:startStreaming', obsHandlers.startStreaming)
  ipcMain.handle('obs:stopStreaming', obsHandlers.stopStreaming)
  ipcMain.handle('obs:toggleStreaming', obsHandlers.toggleStreaming)
  ipcMain.handle('obs:getStats', obsHandlers.getStats)

  // Overlay Editor handlers
  ipcMain.handle('overlayEditor:new', overlayEditorHandlers.newScene)
  ipcMain.handle('overlayEditor:save', overlayEditorHandlers.save)
  ipcMain.handle('overlayEditor:load', overlayEditorHandlers.load)
  ipcMain.handle('overlayEditor:export', overlayEditorHandlers.exportScene)
  ipcMain.handle('overlayEditor:import', overlayEditorHandlers.importScene)
  ipcMain.handle('overlayEditor:undo', overlayEditorHandlers.undo)
  ipcMain.handle('overlayEditor:redo', overlayEditorHandlers.redo)
  ipcMain.handle('overlayEditor:addToHistory', overlayEditorHandlers.addToHistory)
  ipcMain.handle('overlayEditor:getState', overlayEditorHandlers.getState)

  // Overlay Runtime handlers
  ipcMain.handle('overlayRuntime:getCurrentScene', overlayRuntimeHandlers.getCurrentScene)
  ipcMain.handle('overlayRuntime:setCurrentScene', overlayRuntimeHandlers.setCurrentScene)
  ipcMain.handle('overlayRuntime:reloadScene', overlayRuntimeHandlers.reloadScene)
  ipcMain.handle('overlayRuntime:getObjects', overlayRuntimeHandlers.getObjects)
  ipcMain.handle('overlayRuntime:setObjectVisibility', overlayRuntimeHandlers.setObjectVisibility)
  ipcMain.handle('overlayRuntime:startAnimation', overlayRuntimeHandlers.startAnimation)
  ipcMain.handle('overlayRuntime:stopAnimation', overlayRuntimeHandlers.stopAnimation)
  ipcMain.handle('overlayRuntime:startRendering', overlayRuntimeHandlers.startRendering)
  ipcMain.handle('overlayRuntime:stopRendering', overlayRuntimeHandlers.stopRendering)

  // Game Integration handlers
  registerGameIpc()

  // Plugin SDK handlers
  registerPluginIpc()

  // Graph Editor handlers
  registerGraphIpc()
}
