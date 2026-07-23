import { ipcMain } from 'electron'
import { PluginManager } from '../../plugins/PluginManager'
import { PluginManifest } from '../../plugins/types'

const pluginManager = PluginManager.getInstance()

/**
 * Register plugin IPC handlers
 */
export function registerPluginIpc(): void {
  // ============================================================
  // PLUGIN LIST
  // ============================================================
  ipcMain.handle('plugin:list', async () => {
    try {
      const plugins = pluginManager.getAllPlugins()
      return { success: true, data: plugins }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // PLUGIN INSTALL
  // ============================================================
  ipcMain.handle('plugin:install', async (_event, data: { manifest: PluginManifest; path: string }) => {
    try {
      const plugin = await pluginManager.install(data.manifest, data.path)
      return { success: true, data: plugin }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // PLUGIN REMOVE
  // ============================================================
  ipcMain.handle('plugin:remove', async (_event, pluginId: string) => {
    try {
      await pluginManager.uninstall(pluginId)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // PLUGIN ENABLE
  // ============================================================
  ipcMain.handle('plugin:enable', async (_event, pluginId: string) => {
    try {
      await pluginManager.enable(pluginId)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // PLUGIN DISABLE
  // ============================================================
  ipcMain.handle('plugin:disable', async (_event, pluginId: string) => {
    try {
      await pluginManager.disable(pluginId)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // PLUGIN GET INFO
  // ============================================================
  ipcMain.handle('plugin:get-info', async (_event, pluginId: string) => {
    try {
      const plugin = pluginManager.getPlugin(pluginId)
      return { success: true, data: plugin }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // PLUGIN UPDATE SETTINGS
  // ============================================================
  ipcMain.handle('plugin:update-settings', async (_event, pluginId: string, settings: Record<string, unknown>) => {
    try {
      pluginManager.getPlugin(pluginId)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  console.log('Plugin IPC handlers registered')
}
