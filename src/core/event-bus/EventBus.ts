import { MaulfinityEvent } from './types'
import { Logger } from '@services/logger'

type EventCallback = (event: MaulfinityEvent) => void | Promise<void>

interface ListenerRegistration {
  callback: EventCallback
  once: boolean
  source?: string
}

interface EventBusStats {
  totalEvents: number
  eventsByType: Record<string, number>
  listenerCount: number
  lastEventTimestamp: number | null
}

export class EventBus {
  private listeners: Map<string, ListenerRegistration[]> = new Map()
  private static instance: EventBus
  private logger: Logger
  private eventHistory: MaulfinityEvent[] = []
  private maxHistorySize: number = 100
  private stats: EventBusStats = {
    totalEvents: 0,
    eventsByType: {},
    listenerCount: 0,
    lastEventTimestamp: null
  }

  private constructor() {
    this.logger = new Logger('EventBus')
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  /**
   * Subscribe to an event type
   * Supports exact match (e.g., 'gift') and patterns (e.g., 'gift.*')
   */
  on(eventType: string, callback: EventCallback, source?: string): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }

    const registration: ListenerRegistration = {
      callback,
      once: false,
      source
    }

    this.listeners.get(eventType)!.push(registration)
    this.stats.listenerCount++

    this.logger.debug(`Listener registered for '${eventType}'${source ? ` from ${source}` : ''}`)

    // Return unsubscribe function
    return () => {
      this.off(eventType, callback)
    }
  }

  /**
   * Subscribe to an event type, firing only once
   */
  once(eventType: string, callback: EventCallback, source?: string): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }

    const registration: ListenerRegistration = {
      callback,
      once: true,
      source
    }

    this.listeners.get(eventType)!.push(registration)
    this.stats.listenerCount++

    return () => {
      this.off(eventType, callback)
    }
  }

  /**
   * Unsubscribe from an event type
   */
  off(eventType: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      const index = callbacks.findIndex(reg => reg.callback === callback)
      if (index > -1) {
        callbacks.splice(index, 1)
        this.stats.listenerCount--
      }
    }
  }

  /**
   * Remove all listeners for a specific event type
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      const count = this.listeners.get(eventType)?.length || 0
      this.listeners.delete(eventType)
      this.stats.listenerCount -= count
      this.logger.debug(`All listeners removed for '${eventType}'`)
    } else {
      this.stats.listenerCount = 0
      this.listeners.clear()
      this.logger.debug('All listeners removed')
    }
  }

  /**
   * Emit an event to all matching subscribers
   * Supports pattern matching: 'gift.*' matches 'gift.rose', 'gift.tank', etc.
   */
  async emit(event: MaulfinityEvent): Promise<void> {
    this.logger.debug(`Emitting event: ${event.type}`)

    // Update stats
    this.stats.totalEvents++
    this.stats.eventsByType[event.type] = (this.stats.eventsByType[event.type] || 0) + 1
    this.stats.lastEventTimestamp = event.timestamp

    // Add to history
    this.addToHistory(event)

    // Find matching callbacks
    const matchingRegistrations = this.findMatchingListeners(event.type)

    if (matchingRegistrations.length === 0) {
      this.logger.debug(`No listeners for event type '${event.type}'`)
      return
    }

    // Execute callbacks
    const toRemove: Array<{ matchedKey: string; registration: ListenerRegistration }> = []

    for (const registration of matchingRegistrations) {
      try {
        await registration.callback(event)

        if (registration.once) {
          // Find which key the listener was registered under
          const matchedKey = this.findListenerKey(registration.callback)
          if (matchedKey) {
            toRemove.push({ matchedKey, registration })
          }
        }
      } catch (error) {
        this.logger.error(
          `Error in event handler for '${event.type}'${registration.source ? ` from ${registration.source}` : ''}`,
          error as Error
        )
        // Don't remove the listener on error, just log and continue
      }
    }

    // Remove one-time listeners
    for (const { matchedKey, registration } of toRemove) {
      this.off(matchedKey, registration.callback)
    }
  }

  /**
   * Find all listeners that match an event type
   * Supports exact match and wildcard patterns
   */
  private findMatchingListeners(eventType: string): ListenerRegistration[] {
    const matching: ListenerRegistration[] = []

    // Exact match
    const exactListeners = this.listeners.get(eventType)
    if (exactListeners) {
      matching.push(...exactListeners)
    }

    // Pattern match: 'gift.*' matches 'gift.rose'
    for (const [pattern, registrations] of this.listeners) {
      if (pattern === eventType) continue // Already added exact matches
      if (pattern === '*') {
        // Global wildcard
        matching.push(...registrations)
      } else if (pattern.endsWith('.*')) {
        // Pattern wildcard: 'gift.*' matches 'gift.rose'
        const prefix = pattern.slice(0, -2)
        if (eventType.startsWith(prefix + '.')) {
          matching.push(...registrations)
        }
      }
    }

    return matching
  }

  /**
   * Add event to history buffer
   */
  private addToHistory(event: MaulfinityEvent): void {
    this.eventHistory.push(event)
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }
  }

  /**
   * Get event history
   */
  getHistory(limit?: number): MaulfinityEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit)
    }
    return [...this.eventHistory]
  }

  /**
   * Get history filtered by event type
   */
  getHistoryByType(eventType: string, limit?: number): MaulfinityEvent[] {
    const filtered = this.eventHistory.filter(e => e.type === eventType)
    if (limit) {
      return filtered.slice(-limit)
    }
    return filtered
  }

  /**
   * Get all registered event types
   */
  getEventTypes(): string[] {
    return Array.from(this.listeners.keys())
  }

  /**
   * Find the key under which a listener is registered
   */
  private findListenerKey(callback: EventCallback): string | null {
    for (const [key, registrations] of this.listeners) {
      if (registrations.some(reg => reg.callback === callback)) {
        return key
      }
    }
    return null
  }

  /**
   * Get event bus statistics
   */
  getStats(): EventBusStats {
    return {
      totalEvents: this.stats.totalEvents,
      eventsByType: { ...this.stats.eventsByType },
      listenerCount: this.stats.listenerCount,
      lastEventTimestamp: this.stats.lastEventTimestamp
    }
  }

  /**
   * Clear all listeners and history
   */
  clear(): void {
    this.listeners.clear()
    this.eventHistory = []
    this.stats = {
      totalEvents: 0,
      eventsByType: {},
      listenerCount: 0,
      lastEventTimestamp: null
    }
    this.logger.debug('EventBus cleared')
  }

  /**
   * Get listener count for an event type
   */
  getListenerCount(eventType?: string): number {
    if (eventType) {
      return this.listeners.get(eventType)?.length || 0
    }
    return this.stats.listenerCount
  }

  /**
   * Check if there are any listeners for an event type
   */
  hasListeners(eventType: string): boolean {
    const listeners = this.listeners.get(eventType)
    return !!listeners && listeners.length > 0
  }
}
