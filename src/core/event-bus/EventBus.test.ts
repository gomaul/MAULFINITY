import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventBus } from './EventBus'
import { MaulfinityEvent } from './types'

// Mock Logger to avoid file system operations
vi.mock('@services/logger', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    critical: vi.fn()
  }))
}))

describe('EventBus', () => {
  let eventBus: EventBus

  beforeEach(() => {
    // Get fresh instance and clear state
    eventBus = EventBus.getInstance()
    eventBus.clear()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EventBus.getInstance()
      const instance2 = EventBus.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('Event Subscription', () => {
    it('should subscribe to an event type', () => {
      const callback = vi.fn()
      eventBus.on('gift', callback)

      expect(eventBus.hasListeners('gift')).toBe(true)
      expect(eventBus.getListenerCount('gift')).toBe(1)
    })

    it('should return an unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = eventBus.on('gift', callback)

      expect(eventBus.hasListeners('gift')).toBe(true)

      unsubscribe()

      expect(eventBus.hasListeners('gift')).toBe(false)
    })

    it('should subscribe to wildcard patterns', () => {
      const callback = vi.fn()
      eventBus.on('gift.*', callback)

      expect(eventBus.hasListeners('gift.*')).toBe(true)
    })

    it('should subscribe to global wildcard', () => {
      const callback = vi.fn()
      eventBus.on('*', callback)

      expect(eventBus.hasListeners('*')).toBe(true)
    })
  })

  describe('Event Emission', () => {
    it('should emit event to exact match listeners', async () => {
      const callback = vi.fn()
      eventBus.on('gift', callback)

      const event: MaulfinityEvent = {
        id: 'test-1',
        type: 'gift',
        platform: 'tiktok',
        user: 'testuser',
        payload: { name: 'Rose', count: 1 },
        timestamp: Date.now()
      }

      await eventBus.emit(event)

      expect(callback).toHaveBeenCalledWith(event)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should emit event to wildcard listeners', async () => {
      const callback = vi.fn()
      eventBus.on('gift.*', callback)

      const event: MaulfinityEvent = {
        id: 'test-1',
        type: 'gift.rose',
        platform: 'tiktok',
        user: 'testuser',
        payload: { name: 'Rose', count: 1 },
        timestamp: Date.now()
      }

      await eventBus.emit(event)

      expect(callback).toHaveBeenCalledWith(event)
    })

    it('should emit event to global wildcard listeners', async () => {
      const callback = vi.fn()
      eventBus.on('*', callback)

      const event: MaulfinityEvent = {
        id: 'test-1',
        type: 'gift',
        platform: 'tiktok',
        user: 'testuser',
        payload: { name: 'Rose', count: 1 },
        timestamp: Date.now()
      }

      await eventBus.emit(event)

      expect(callback).toHaveBeenCalledWith(event)
    })

    it('should handle async callbacks', async () => {
      const callback = vi.fn().mockResolvedValue(undefined)
      eventBus.on('gift', callback)

      const event: MaulfinityEvent = {
        id: 'test-1',
        type: 'gift',
        platform: 'tiktok',
        user: 'testuser',
        payload: { name: 'Rose', count: 1 },
        timestamp: Date.now()
      }

      await eventBus.emit(event)

      expect(callback).toHaveBeenCalled()
    })
  })

  describe('Once Subscribers', () => {
    it('should fire only once', async () => {
      const callback = vi.fn()
      eventBus.once('gift', callback)

      const event: MaulfinityEvent = {
        id: 'test-1',
        type: 'gift',
        platform: 'tiktok',
        user: 'testuser',
        payload: { name: 'Rose', count: 1 },
        timestamp: Date.now()
      }

      await eventBus.emit(event)
      await eventBus.emit(event)

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('Event History', () => {
    it('should store events in history', async () => {
      const event: MaulfinityEvent = {
        id: 'test-1',
        type: 'gift',
        platform: 'tiktok',
        user: 'testuser',
        payload: { name: 'Rose', count: 1 },
        timestamp: Date.now()
      }

      await eventBus.emit(event)

      const history = eventBus.getHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual(event)
    })

    it('should limit history size', async () => {
      // Emit more events than max history size (100)
      for (let i = 0; i < 110; i++) {
        const event: MaulfinityEvent = {
          id: `test-${i}`,
          type: 'gift',
          platform: 'tiktok',
          user: 'testuser',
          payload: { name: 'Rose', count: 1 },
          timestamp: Date.now() + i
        }
        await eventBus.emit(event)
      }

      const history = eventBus.getHistory()
      expect(history.length).toBeLessThanOrEqual(100)
    })

    it('should filter history by type', async () => {
      await eventBus.emit({
        id: 'test-1',
        type: 'gift',
        platform: 'tiktok',
        user: 'testuser',
        payload: { name: 'Rose', count: 1 },
        timestamp: Date.now()
      })

      await eventBus.emit({
        id: 'test-2',
        type: 'comment',
        platform: 'tiktok',
        user: 'testuser',
        payload: { text: 'Hello' },
        timestamp: Date.now()
      })

      const giftHistory = eventBus.getHistoryByType('gift')
      expect(giftHistory).toHaveLength(1)
      expect(giftHistory[0].type).toBe('gift')
    })
  })

  describe('Statistics', () => {
    it('should track total events', async () => {
      const event: MaulfinityEvent = {
        id: 'test-1',
        type: 'gift',
        platform: 'tiktok',
        user: 'testuser',
        payload: { name: 'Rose', count: 1 },
        timestamp: Date.now()
      }

      await eventBus.emit(event)

      const stats = eventBus.getStats()
      expect(stats.totalEvents).toBe(1)
    })

    it('should track events by type', async () => {
      await eventBus.emit({
        id: 'test-1',
        type: 'gift',
        platform: 'tiktok',
        user: 'testuser',
        payload: { name: 'Rose', count: 1 },
        timestamp: Date.now()
      })

      await eventBus.emit({
        id: 'test-2',
        type: 'gift',
        platform: 'tiktok',
        user: 'testuser',
        payload: { name: 'Lion', count: 1 },
        timestamp: Date.now()
      })

      const stats = eventBus.getStats()
      expect(stats.eventsByType['gift']).toBe(2)
    })

    it('should track listener count', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      eventBus.on('gift', callback1)
      eventBus.on('comment', callback2)

      const stats = eventBus.getStats()
      expect(stats.listenerCount).toBe(2)
    })
  })

  describe('Error Recovery', () => {
    it('should continue after listener error', async () => {
      const errorCallback = vi.fn().mockRejectedValue(new Error('Test error'))
      const successCallback = vi.fn()

      eventBus.on('gift', errorCallback)
      eventBus.on('gift', successCallback)

      const event: MaulfinityEvent = {
        id: 'test-1',
        type: 'gift',
        platform: 'tiktok',
        user: 'testuser',
        payload: { name: 'Rose', count: 1 },
        timestamp: Date.now()
      }

      await eventBus.emit(event)

      expect(errorCallback).toHaveBeenCalled()
      expect(successCallback).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('should clear all listeners and history', async () => {
      const callback = vi.fn()
      eventBus.on('gift', callback)

      await eventBus.emit({
        id: 'test-1',
        type: 'gift',
        platform: 'tiktok',
        user: 'testuser',
        payload: { name: 'Rose', count: 1 },
        timestamp: Date.now()
      })

      eventBus.clear()

      expect(eventBus.hasListeners('gift')).toBe(false)
      expect(eventBus.getHistory()).toHaveLength(0)
      expect(eventBus.getStats().totalEvents).toBe(0)
    })
  })
})
