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

  // Automation operations
  automation: {
    list: (profileId: string) => ipcRenderer.invoke('automation:list', profileId),
    get: (id: string) => ipcRenderer.invoke('automation:get', id),
    create: (data: unknown) => ipcRenderer.invoke('automation:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('automation:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('automation:delete', id),
    toggle: (id: string) => ipcRenderer.invoke('automation:toggle', id),
    test: (id: string, testEvent?: unknown) => ipcRenderer.invoke('automation:test', id, testEvent),
    execute: (id: string, eventData: unknown) => ipcRenderer.invoke('automation:execute', id, eventData),
    getHistory: (automationId?: string, limit?: number) => ipcRenderer.invoke('automation:getHistory', automationId, limit),
    getStats: () => ipcRenderer.invoke('automation:getStats')
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

  // Overlay Editor operations
  overlayEditor: {
    newScene: (data: { name: string; width: number; height: number }) => ipcRenderer.invoke('overlayEditor:new', data),
    save: (data: { id: string; scene: unknown }) => ipcRenderer.invoke('overlayEditor:save', data),
    load: (id: string) => ipcRenderer.invoke('overlayEditor:load', id),
    exportScene: (data: { scene: unknown; defaultName?: string }) => ipcRenderer.invoke('overlayEditor:export', data),
    importScene: () => ipcRenderer.invoke('overlayEditor:import'),
    undo: () => ipcRenderer.invoke('overlayEditor:undo'),
    redo: () => ipcRenderer.invoke('overlayEditor:redo'),
    addToHistory: (scene: unknown) => ipcRenderer.invoke('overlayEditor:addToHistory', scene),
    getState: () => ipcRenderer.invoke('overlayEditor:getState')
  },

  // Plugin SDK operations
  plugin: {
    list: () => ipcRenderer.invoke('plugin:list'),
    install: (data: unknown) => ipcRenderer.invoke('plugin:install', data),
    remove: (pluginId: string) => ipcRenderer.invoke('plugin:remove', pluginId),
    enable: (pluginId: string) => ipcRenderer.invoke('plugin:enable', pluginId),
    disable: (pluginId: string) => ipcRenderer.invoke('plugin:disable', pluginId),
    getInfo: (pluginId: string) => ipcRenderer.invoke('plugin:get-info', pluginId),
    updateSettings: (pluginId: string, settings: unknown) => ipcRenderer.invoke('plugin:update-settings', pluginId, settings)
  },

  // System operations
  system: {
    getVersion: () => ipcRenderer.invoke('system:getVersion'),
    getStatus: () => ipcRenderer.invoke('system:getStatus'),
    restart: () => ipcRenderer.invoke('system:restart')
  },

  // Game Integration operations
  game: {
    list: () => ipcRenderer.invoke('game:list'),
    register: (data: unknown) => ipcRenderer.invoke('game:register', data),
    remove: (gameId: string) => ipcRenderer.invoke('game:remove', gameId),
    connect: (gameId: string) => ipcRenderer.invoke('game:connect', gameId),
    disconnect: (gameId: string) => ipcRenderer.invoke('game:disconnect', gameId),
    getState: (gameId: string) => ipcRenderer.invoke('game:get-state', gameId),
    sendCommand: (gameId: string, command: unknown) => ipcRenderer.invoke('game:send-command', gameId, command),
    getAllStatus: () => ipcRenderer.invoke('game:get-all-status'),
    testEvent: (gameId: string, type: string, eventData: unknown) => ipcRenderer.invoke('game:test-event', { gameId, type, eventData })
  },

  // Graph Editor operations
  graph: {
    list: () => ipcRenderer.invoke('graph:list'),
    get: (graphId: string) => ipcRenderer.invoke('graph:get', graphId),
    new: (data: { name: string; description?: string }) => ipcRenderer.invoke('graph:new', data),
    save: (graph: unknown) => ipcRenderer.invoke('graph:save', graph),
    delete: (graphId: string) => ipcRenderer.invoke('graph:delete', graphId),
    toggle: (graphId: string) => ipcRenderer.invoke('graph:toggle', graphId),
    addNode: (graphId: string, node: unknown) => ipcRenderer.invoke('graph:addNode', graphId, node),
    updateNode: (graphId: string, nodeId: string, updates: unknown) => ipcRenderer.invoke('graph:updateNode', graphId, nodeId, updates),
    removeNode: (graphId: string, nodeId: string) => ipcRenderer.invoke('graph:removeNode', graphId, nodeId),
    addConnection: (graphId: string, connection: unknown) => ipcRenderer.invoke('graph:addConnection', graphId, connection),
    removeConnection: (graphId: string, connectionId: string) => ipcRenderer.invoke('graph:removeConnection', graphId, connectionId),
    addVariable: (graphId: string, variable: unknown) => ipcRenderer.invoke('graph:addVariable', graphId, variable),
    removeVariable: (graphId: string, name: string) => ipcRenderer.invoke('graph:removeVariable', graphId, name),
    getNodeTypes: () => ipcRenderer.invoke('graph:getNodeTypes'),
    validate: (graph: unknown) => ipcRenderer.invoke('graph:validate', graph),
    execute: (graphId: string, eventData: unknown) => ipcRenderer.invoke('graph:execute', graphId, eventData),
    export: (graphId: string) => ipcRenderer.invoke('graph:export', graphId),
    import: (data: unknown) => ipcRenderer.invoke('graph:import', data),
    getStats: () => ipcRenderer.invoke('graph:getStats')
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
