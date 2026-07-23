import { app } from 'electron'

let connectionStatus = { connected: false, platform: null as string | null }

export const systemHandlers = {
  async getVersion(): Promise<string> {
    return app.getVersion()
  },

  async getStatus(): Promise<{ connected: boolean; platform: string | null }> {
    return connectionStatus
  },

  async restart(): Promise<void> {
    app.relaunch()
    app.exit(0)
  }
}
