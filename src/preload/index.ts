import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Maulfinity API - exposed to renderer via contextBridge
const maulfinity = {
  // Profile operations
  profile: {
    list: () => ipcRenderer.invoke('profile:list'),
    get: (id: string) => ipcRenderer.invoke('profile:get', id),
    create: (data: unknown) => ipcRenderer.invoke('profile:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('profile:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('profile:delete', id)
  },

  // Trigger operations
  trigger: {
    list: (profileId: string) => ipcRenderer.invoke('trigger:list', profileId),
    create: (data: unknown) => ipcRenderer.invoke('trigger:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('trigger:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('trigger:delete', id),
    test: (id: string) => ipcRenderer.invoke('trigger:test', id),
    toggle: (id: string) => ipcRenderer.invoke('trigger:toggle', id)
  },

  // Asset operations
  asset: {
    list: () => ipcRenderer.invoke('asset:list'),
    import: (data: unknown) => ipcRenderer.invoke('asset:import', data),
    delete: (id: string) => ipcRenderer.invoke('asset:delete', id),
    scan: () => ipcRenderer.invoke('asset:scan')
  },

  // Connector operations
  connector: {
    connect: (platform: string, username: string) => ipcRenderer.invoke('connector:connect', platform, username),
    disconnect: (platform: string) => ipcRenderer.invoke('connector:disconnect', platform),
    status: (platform: string) => ipcRenderer.invoke('connector:status', platform),
    allStatus: () => ipcRenderer.invoke('connector:allStatus'),
    list: () => ipcRenderer.invoke('connector:list'),
    getEventHistory: (limit?: number) => ipcRenderer.invoke('connector:getEventHistory', limit)
  },

  // Overlay operations
  overlay: {
    list: (profileId: string) => ipcRenderer.invoke('overlay:list', profileId),
    save: (data: unknown) => ipcRenderer.invoke('overlay:save', data),
    preview: (id: string) => ipcRenderer.invoke('overlay:preview', id)
  },

  // Plugin operations
  plugin: {
    list: () => ipcRenderer.invoke('plugin:list'),
    install: (path: string) => ipcRenderer.invoke('plugin:install', path),
    disable: (id: string) => ipcRenderer.invoke('plugin:disable', id),
    remove: (id: string) => ipcRenderer.invoke('plugin:remove', id)
  },

  // System operations
  system: {
    getVersion: () => ipcRenderer.invoke('system:getVersion'),
    getStatus: () => ipcRenderer.invoke('system:getStatus'),
    restart: () => ipcRenderer.invoke('system:restart')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('maulfinity', maulfinity)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.maulfinity = maulfinity
}
