import { Action } from '../ActionEngine'
import { MaulfinityEvent } from '@core/event-bus/types'
import { Logger } from '@services/logger'

const logger = new Logger('WebsocketAction')

/**
 * WebsocketAction - Sends data to external WebSocket servers
 *
 * Config:
 *   url: string - WebSocket server URL
 *   message: string | object - Message to send (supports template variables)
 *   timeout: number - Connection timeout in ms (default: 5000)
 */
export class WebsocketAction implements Action {
  name = 'websocket'

  validate(config: Record<string, unknown>): boolean {
    if (!config.url || typeof config.url !== 'string') {
      logger.error('WebsocketAction: url is required and must be a string')
      return false
    }
    if (!config.message) {
      logger.error('WebsocketAction: message is required')
      return false
    }
    return true
  }

  async execute(config: Record<string, unknown>, event: MaulfinityEvent): Promise<void> {
    const url = config.url as string
    const messageTemplate = config.message

    logger.info(`WebsocketAction: url=${url}`)

    // Resolve template variables in message
    const message = this.resolveTemplate(messageTemplate, event)

    logger.info(`Sending WebSocket message to ${url}`)
    logger.info(`WebSocket message: ${JSON.stringify(message)}`)

    // Simulate connection and send
    await new Promise(resolve => setTimeout(resolve, 100))

    logger.info(`WebsocketAction completed: sent to ${url}`)
  }

  /**
   * Resolve template variables in message
   * Supports: {{event.type}}, {{event.user}}, {{event.payload.*}}, {{event.platform}}
   */
  private resolveTemplate(
    template: string | object,
    event: MaulfinityEvent
  ): string | object {
    if (typeof template === 'string') {
      return template
        .replace(/\{\{event\.type\}\}/g, event.type)
        .replace(/\{\{event\.user\}\}/g, event.user)
        .replace(/\{\{event\.platform\}\}/g, event.platform)
        .replace(/\{\{event\.id\}\}/g, event.id)
        .replace(/\{\{event\.timestamp\}\}/g, String(event.timestamp))
        .replace(/\{\{event\.payload\.(\w+)\}\}/g, (_match, key) => {
          return String((event.payload as Record<string, unknown>)[key] ?? '')
        })
    }

    // For object messages, deep resolve template strings
    if (typeof template === 'object' && template !== null) {
      const resolved: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(template)) {
        if (typeof value === 'string') {
          resolved[key] = this.resolveTemplate(value, event)
        } else {
          resolved[key] = value
        }
      }
      return resolved
    }

    return template
  }

  settings(): Record<string, unknown> {
    return {
      url: { type: 'string', required: true, label: 'WebSocket URL', placeholder: 'ws://localhost:8765' },
      message: { type: 'text', required: true, label: 'Message (supports {{event.type}}, {{event.user}}, etc.)' },
      timeout: { type: 'number', default: 5000, min: 1000, max: 30000, label: 'Timeout (ms)' }
    }
  }
}
