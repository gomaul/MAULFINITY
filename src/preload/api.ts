export interface Profile {
  id: string
  name: string
  description: string | null
  settings_json: string
  created_at: string
  updated_at: string
}

export interface Trigger {
  id: string
  profile_id: string
  name: string
  enabled: number
  event_type: string
  condition_json: string
  actions_json: string
  created_at: string
}

export interface Automation {
  id: string
  profile_id: string
  name: string
  description: string | null
  type: string
  enabled: number
  event_type: string
  conditions_json: string
  actions_json: string
  cooldown: number
  max_executions: number | null
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  name: string
  type: string
  category: string | null
  path: string
  metadata_json: string
  created_at: string
}

export interface Connector {
  id: string
  profile_id: string
  platform: string
  username: string
  status: string
  config_json: string
}

export interface Overlay {
  id: string
  profile_id: string
  name: string
  scene_json: string
  created_at: string
  updated_at: string
}

export interface Plugin {
  id: string
  name: string
  version: string
  enabled: number
  permissions_json: string
  path: string | null
}

export interface OBSStatus {
  status: string
  state: {
    status: string
    scenes: Array<{ name: string; isActive: boolean }>
    currentScene: string | null
    sources: Array<{ name: string; type: string; enabled: boolean; visible: boolean }>
    isRecording: boolean
    isStreaming: boolean
    recordingTime: number
    streamingTime: number
    stats: { cpu: number; memory: number; fps: number; bitrate: number }
  }
}

export interface OverlayScene {
  id: string
  name: string
  objects: OverlayObject[]
  settings: { width: number; height: number; backgroundColor?: string }
}

export interface OverlayObject {
  id: string
  type: string
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  zIndex: number
  config: Record<string, unknown>
  animation?: { type: string; duration: number; easing?: string }
}

// Graph Editor Types
export interface AutomationGraph {
  id: string
  name: string
  description: string
  version: string
  author: string
  tags: string[]
  nodes: GraphNode[]
  connections: GraphConnection[]
  variables: GraphVariable[]
  settings: GraphSettings
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface GraphNode {
  id: string
  type: string
  position: { x: number; y: number }
  config: Record<string, unknown>
  disabled?: boolean
}

export interface GraphConnection {
  id: string
  from: { nodeId: string; portName: string }
  to: { nodeId: string; portName: string }
}

export interface GraphVariable {
  name: string
  type: 'number' | 'string' | 'boolean'
  defaultValue: unknown
  description?: string
}

export interface GraphSettings {
  maxExecutionDepth: number
  maxParallelExecutions: number
  executionTimeout: number
  cooldown: number
}

export interface GraphNodeType {
  type: string
  category: string
  name: string
  description: string
  icon: string
  color: string
}

export interface ValidationResult {
  valid: boolean
  errors: Array<{ type: string; id?: string; message: string }>
  warnings: Array<{ type: string; id?: string; message: string }>
}

export interface MaulfinityAPI {
  profile: {
    list: () => Promise<Profile[]>
    get: (id: string) => Promise<Profile | null>
    create: (data: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => Promise<Profile>
    update: (id: string, data: Partial<Profile>) => Promise<Profile>
    delete: (id: string) => Promise<void>
  }
  trigger: {
    list: (profileId: string) => Promise<Trigger[]>
    create: (data: Omit<Trigger, 'id' | 'created_at'>) => Promise<Trigger>
    update: (id: string, data: Partial<Trigger>) => Promise<Trigger>
    delete: (id: string) => Promise<void>
    test: (id: string) => Promise<boolean>
    toggle: (id: string) => Promise<Trigger>
  }
  automation: {
    list: (profileId: string) => Promise<Automation[]>
    get: (id: string) => Promise<Automation | null>
    create: (data: Omit<Automation, 'id' | 'created_at' | 'updated_at'>) => Promise<Automation>
    update: (id: string, data: Partial<Automation>) => Promise<Automation>
    delete: (id: string) => Promise<void>
    toggle: (id: string) => Promise<Automation>
    test: (id: string, testEvent?: Record<string, unknown>) => Promise<{ success: boolean; executionId: string; status: string; duration?: number; error?: string }>
    execute: (id: string, eventData: Record<string, unknown>) => Promise<{ success: boolean; executionId: string; status: string; duration?: number; error?: string }>
    getHistory: (automationId?: string, limit?: number) => Promise<Array<{ id: string; automation_id: string; event_id: string; status: string; started_at: string; completed_at?: string; duration_ms?: number }>>
    getStats: () => Promise<{ total: number; enabled: number; byProfile: Record<string, number> }>
  }
  asset: {
    list: () => Promise<Asset[]>
    import: (data: { name: string; type: string; path: string; category?: string }) => Promise<Asset>
    delete: (id: string) => Promise<void>
    scan: () => Promise<Asset[]>
  }
  connector: {
    connect: (platform: string, username: string) => Promise<boolean>
    disconnect: (platform: string) => Promise<void>
    status: (platform: string) => Promise<{ connected: boolean; platform: string; state: string; username?: string }>
    allStatus: () => Promise<Array<{ platform: string; connected: boolean; state: string; username?: string; stats: { eventsReceived: number; eventsEmitted: number; errors: number; uptime: number } }>>
    list: () => Promise<string[]>
    getEventHistory: (limit?: number) => Promise<Array<{ id: string; type: string; platform: string; user: string; payload: Record<string, unknown>; timestamp: number }>>
  }
  obs: {
    connect: (config?: { host?: string; port?: number; password?: string }) => Promise<boolean>
    disconnect: () => Promise<void>
    status: () => Promise<OBSStatus>
    getScenes: () => Promise<Array<{ name: string; isActive: boolean }>>
    switchScene: (sceneName: string) => Promise<boolean>
    getSources: (sceneName?: string) => Promise<Array<{ name: string; type: string; enabled: boolean; visible: boolean }>>
    setSourceVisibility: (sceneName: string, sourceName: string, visible: boolean) => Promise<boolean>
    startRecording: () => Promise<boolean>
    stopRecording: () => Promise<boolean>
    toggleRecording: () => Promise<boolean>
    startStreaming: () => Promise<boolean>
    stopStreaming: () => Promise<boolean>
    toggleStreaming: () => Promise<boolean>
    getStats: () => Promise<{ cpu: number; memory: number; fps: number; bitrate: number }>
  }
  overlay: {
    list: (profileId: string) => Promise<Overlay[]>
    save: (data: Omit<Overlay, 'id' | 'created_at' | 'updated_at'>) => Promise<Overlay>
    preview: (id: string) => Promise<string>
  }
  overlayRuntime: {
    getCurrentScene: () => Promise<OverlayScene | null>
    setCurrentScene: (sceneId: string) => Promise<void>
    reloadScene: (sceneId: string) => Promise<void>
    getObjects: () => Promise<OverlayObject[]>
    setObjectVisibility: (objectId: string, visible: boolean) => Promise<void>
    startAnimation: (objectId: string, animation: { type: string; duration: number; easing?: string }) => Promise<void>
    stopAnimation: (objectId: string) => Promise<void>
    startRendering: () => Promise<void>
    stopRendering: () => Promise<void>
  }
  plugin: {
    list: () => Promise<{ success: boolean; data: Array<{ manifest: { id: string; name: string; version: string; description: string; author: string; type: string; permissions: string[] }; state: string; config: Record<string, unknown>; grantedPermissions: string[]; error?: string; installedAt: string; lastEnabledAt?: string }> }>
    install: (data: { manifest: Record<string, unknown>; path: string }) => Promise<{ success: boolean; data?: unknown; error?: string }>
    remove: (pluginId: string) => Promise<{ success: boolean; error?: string }>
    enable: (pluginId: string) => Promise<{ success: boolean; error?: string }>
    disable: (pluginId: string) => Promise<{ success: boolean; error?: string }>
    getInfo: (pluginId: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
    updateSettings: (pluginId: string, settings: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
  }
  system: {
    getVersion: () => Promise<string>
    getStatus: () => Promise<{ connected: boolean; platform: string | null }>
    restart: () => Promise<void>
  }
  game: {
    list: () => Promise<{ success: boolean; data: Array<{ id: string; name: string; adapter: string; status: string; enabled: number }> }>
    register: (data: { id: string; name: string; adapter: string; version?: string; description?: string; config?: Record<string, unknown> }) => Promise<{ success: boolean; data?: unknown; error?: string }>
    remove: (gameId: string) => Promise<{ success: boolean; error?: string }>
    connect: (gameId: string) => Promise<{ success: boolean; error?: string }>
    disconnect: (gameId: string) => Promise<{ success: boolean; error?: string }>
    getState: (gameId: string) => Promise<{ success: boolean; data?: { adapterState: string | null; gameState: unknown } }>
    sendCommand: (gameId: string, command: { action: string; params: Record<string, unknown> }) => Promise<{ success: boolean; data?: { success: boolean; data?: unknown; error?: string; duration: number } }>
    getAllStatus: () => Promise<{ success: boolean; data: Array<{ game: { id: string; name: string; adapter: string; status: string }; connected: boolean; state: string | null; stats: unknown }> }>
    testEvent: (gameId: string, type: string, eventData: Record<string, unknown>) => Promise<{ success: boolean; data?: unknown }>
  }
  graph: {
    list: () => Promise<{ success: boolean; data: AutomationGraph[] }>
    get: (graphId: string) => Promise<{ success: boolean; data?: AutomationGraph; error?: string }>
    new: (data: { name: string; description?: string }) => Promise<{ success: boolean; data?: AutomationGraph; error?: string }>
    save: (graph: AutomationGraph) => Promise<{ success: boolean; data?: AutomationGraph; error?: string }>
    delete: (graphId: string) => Promise<{ success: boolean; error?: string }>
    toggle: (graphId: string) => Promise<{ success: boolean; data?: AutomationGraph; error?: string }>
    addNode: (graphId: string, node: GraphNode) => Promise<{ success: boolean; data?: GraphNode; error?: string }>
    updateNode: (graphId: string, nodeId: string, updates: Partial<GraphNode>) => Promise<{ success: boolean; data?: GraphNode; error?: string }>
    removeNode: (graphId: string, nodeId: string) => Promise<{ success: boolean; data?: boolean; error?: string }>
    addConnection: (graphId: string, connection: GraphConnection) => Promise<{ success: boolean; data?: GraphConnection; error?: string }>
    removeConnection: (graphId: string, connectionId: string) => Promise<{ success: boolean; data?: boolean; error?: string }>
    addVariable: (graphId: string, variable: GraphVariable) => Promise<{ success: boolean; error?: string }>
    removeVariable: (graphId: string, name: string) => Promise<{ success: boolean; data?: boolean; error?: string }>
    getNodeTypes: () => Promise<{ success: boolean; data?: Array<{ category: string; nodes: GraphNodeType[] }>; error?: string }>
    validate: (graph: AutomationGraph) => Promise<{ success: boolean; data?: ValidationResult; error?: string }>
    execute: (graphId: string, eventData: Record<string, unknown>) => Promise<{ success: boolean; data?: unknown; error?: string }>
    export: (graphId: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
    import: (data: unknown) => Promise<{ success: boolean; data?: AutomationGraph; error?: string }>
    getStats: () => Promise<{ success: boolean; data?: { total: number; enabled: number; totalNodes: number; totalConnections: number }; error?: string }>
  }
}

declare global {
  interface Window {
    maulfinity: MaulfinityAPI
  }
}
