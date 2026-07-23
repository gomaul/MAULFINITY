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
    list: () => Promise<Plugin[]>
    install: (path: string) => Promise<Plugin>
    disable: (id: string) => Promise<void>
    remove: (id: string) => Promise<void>
  }
  system: {
    getVersion: () => Promise<string>
    getStatus: () => Promise<{ connected: boolean; platform: string | null }>
    restart: () => Promise<void>
  }
}

declare global {
  interface Window {
    maulfinity: MaulfinityAPI
  }
}
