import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ServiceContainer } from '@core/service-container/ServiceContainer'

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

describe('ServiceContainer', () => {
  let container: ServiceContainer

  beforeEach(() => {
    container = ServiceContainer.getInstance()
    container.clear()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ServiceContainer.getInstance()
      const instance2 = ServiceContainer.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('Service Registration', () => {
    it('should register a service with factory', () => {
      container.register('testService', () => ({ name: 'test' }))
      expect(container.has('testService')).toBe(true)
    })

    it('should register an instance', () => {
      const instance = { name: 'test' }
      container.registerInstance('testService', instance)
      expect(container.has('testService')).toBe(true)
    })

    it('should track registered services', () => {
      container.register('service1', () => ({}))
      container.register('service2', () => ({}))

      const services = container.getRegisteredServices()
      expect(services).toContain('service1')
      expect(services).toContain('service2')
    })

    it('should overwrite existing service with warning', () => {
      container.register('testService', () => ({ name: 'first' }))
      container.register('testService', () => ({ name: 'second' }))

      expect(container.has('testService')).toBe(true)
    })
  })

  describe('Service Resolution', () => {
    it('should resolve a registered instance', async () => {
      const instance = { name: 'test' }
      container.registerInstance('testService', instance)

      const resolved = await container.resolve<typeof instance>('testService')
      expect(resolved).toBe(instance)
    })

    it('should resolve using factory function', async () => {
      const factory = vi.fn().mockReturnValue({ name: 'test' })
      container.register('testService', factory)

      const resolved = await container.resolve<{ name: string }>('testService')
      expect(resolved).toEqual({ name: 'test' })
      expect(factory).toHaveBeenCalledTimes(1)
    })

    it('should cache singleton instances', async () => {
      const factory = vi.fn().mockReturnValue({ name: 'test' })
      container.register('testService', factory, { singleton: true })

      await container.resolve('testService')
      await container.resolve('testService')

      expect(factory).toHaveBeenCalledTimes(1)
    })

    it('should create new instance for non-singleton', async () => {
      const factory = vi.fn().mockReturnValue({ name: 'test' })
      container.register('testService', factory, { singleton: false })

      await container.resolve('testService')
      await container.resolve('testService')

      expect(factory).toHaveBeenCalledTimes(2)
    })

    it('should throw for unregistered service', async () => {
      await expect(container.resolve('nonExistent')).rejects.toThrow('Service \'nonExistent\' is not registered')
    })

    it('should support custom types with resolve<T>', async () => {
      interface CustomService {
        doSomething(): string
      }

      const instance: CustomService = {
        doSomething: () => 'done'
      }

      container.registerInstance<CustomService>('custom', instance)
      const resolved = await container.resolve<CustomService>('custom')

      expect(resolved.doSomething()).toBe('done')
    })
  })

  describe('Synchronous Resolution', () => {
    it('should resolve sync for cached instances', () => {
      const instance = { name: 'test' }
      container.registerInstance('testService', instance)

      const resolved = container.resolveSync<typeof instance>('testService')
      expect(resolved).toBe(instance)
    })

    it('should throw for non-cached services', () => {
      container.register('testService', () => ({ name: 'test' }))

      expect(() => container.resolveSync('testService')).toThrow('has not been initialized yet')
    })

    it('should throw for unregistered services', () => {
      expect(() => container.resolveSync('nonExistent')).toThrow('Service \'nonExistent\' is not registered')
    })
  })

  describe('Service State', () => {
    it('should check if service is resolved', () => {
      container.registerInstance('resolved', { name: 'resolved' })
      container.register('unresolved', () => ({ name: 'unresolved' }))

      expect(container.isResolved('resolved')).toBe(true)
      expect(container.isResolved('unresolved')).toBe(false)
    })

    it('should return correct size', () => {
      expect(container.size).toBe(0)

      container.register('service1', () => ({}))
      expect(container.size).toBe(1)

      container.register('service2', () => ({}))
      expect(container.size).toBe(2)
    })
  })

  describe('Service Initialization', () => {
    it('should initialize all singleton services', async () => {
      const factory1 = vi.fn().mockReturnValue({ name: 'service1' })
      const factory2 = vi.fn().mockReturnValue({ name: 'service2' })

      container.register('service1', factory1, { singleton: true })
      container.register('service2', factory2, { singleton: true })

      await container.initializeAll()

      expect(factory1).toHaveBeenCalled()
      expect(factory2).toHaveBeenCalled()
    })

    it('should not initialize twice', async () => {
      const factory = vi.fn().mockReturnValue({ name: 'test' })
      container.register('test', factory, { singleton: true })

      await container.initializeAll()
      await container.initializeAll()

      expect(factory).toHaveBeenCalledTimes(1)
    })

    it('should throw if initialization fails', async () => {
      const factory = vi.fn().mockRejectedValue(new Error('Init failed'))
      container.register('failing', factory, { singleton: true })

      await expect(container.initializeAll()).rejects.toThrow('Init failed')
    })
  })

  describe('Cleanup', () => {
    it('should clear all services', () => {
      container.registerInstance('service1', { name: 'test' })
      container.register('service2', () => ({}))

      container.clear()

      expect(container.size).toBe(0)
      expect(container.getRegisteredServices()).toHaveLength(0)
    })

    it('should reset initialized state after clear', async () => {
      const factory = vi.fn().mockReturnValue({ name: 'test' })
      container.register('test', factory, { singleton: true })

      await container.initializeAll()
      container.clear()

      // Re-register after clear
      container.register('test', factory, { singleton: true })
      
      // Should be able to initialize again
      await container.initializeAll()
      expect(factory).toHaveBeenCalledTimes(2)
    })
  })
})
