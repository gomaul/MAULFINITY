import { IpcMainInvokeEvent } from 'electron'
import { Logger } from '@services/logger'
import { ConnectorManager } from '@connectors/core/ConnectorManager'
import { EventBus } from '@core/event-bus/EventBus'

const logger = new Logger('ConnectorIPC')
const connectorManager = ConnectorManager.getInstance()
const eventBus = EventBus.getInstance()

export const connectorHandlers = {
  async connect(_event: IpcMainInvokeEvent, platform: string, username: string): Promise<boolean> {
    logger.info(`Connecting to ${platform} as ${username}`)

    const success = await connectorManager.connect(platform, {
      platform,
      username
    })

    return success
  },

  async disconnect(_event: IpcMainInvokeEvent, platform: string): Promise<void> {
    logger.info(`Disconnecting from ${platform}`)
    await connectorManager.disconnect(platform)
  },

  async status(_event: IpcMainInvokeEvent, platform: string): Promise<{ connected: boolean; platform: string; state: string; username?: string }> {
    const status = connectorManager.getStatus(platform)

    if (!status) {
      return { connected: false, platform, state: 'disconnected' }
    }

    return {
      connected: status.connected,
      platform: status.platform,
      state: status.state,
      username: status.username
    }
  },

  async allStatus(_event: IpcMainInvokeEvent): Promise<Array<{ platform: string; connected: boolean; state: string; username?: string; stats: { eventsReceived: number; eventsEmitted: number; errors: number; uptime: number } }>> {
    return connectorManager.getAllStatus().map(s => ({
      platform: s.platform,
      connected: s.connected,
      state: s.state,
      username: s.username,
      stats: {
        eventsReceived: s.stats.eventsReceived,
        eventsEmitted: s.stats.eventsEmitted,
        errors: s.stats.errors,
        uptime: s.stats.uptime
      }
    }))
  },

  async list(_event: IpcMainInvokeEvent): Promise<string[]> {
    return connectorManager.getAvailablePlatforms()
  },

  async getEventHistory(_event: IpcMainInvokeEvent, limit?: number): Promise<Array<{ id: string; type: string; platform: string; user: string; payload: Record<string, unknown>; timestamp: number }>> {
    return eventBus.getHistory(limit).map(e => ({
      id: e.id,
      type: e.type,
      platform: e.platform,
      user: e.user,
      payload: e.payload,
      timestamp: e.timestamp
    }))
  }
}
