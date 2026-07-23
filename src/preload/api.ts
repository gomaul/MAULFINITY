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
  overlay: {
    list: (profileId: string) => Promise<Overlay[]>
    save: (data: Omit<Overlay, 'id' | 'created_at' | 'updated_at'>) => Promise<Overlay>
    preview: (id: string) => Promise<string>
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
