import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ActionEngine, Action } from './ActionEngine'
import { MaulfinityEvent } from '../event-bus/types'

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

// Mock action implementations
const createMockAction = (name: string): Action => ({
  name,
  validate: vi.fn().mockReturnValue(true),
  execute: vi.fn().mockResolvedValue(undefined),
  settings: vi.fn().mockReturnValue({})
})

const createMockEvent = (type: string = 'gift'): MaulfinityEvent => ({
  id: 'test-1',
  type,
  platform: 'tiktok',
  user: 'testuser',
  payload: { name: 'Rose', count: 1 },
  timestamp: Date.now()
})

describe('ActionEngine', () => {
  let engine: ActionEngine

  beforeEach(() => {
    engine = ActionEngine.getInstance()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ActionEngine.getInstance()
      const instance2 = ActionEngine.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('Built-in Actions', () => {
    it('should have keyboard action registered', () => {
      expect(engine.hasAction('keyboard')).toBe(true)
    })

    it('should have sound action registered', () => {
      expect(engine.hasAction('sound')).toBe(true)
    })

    it('should have websocket action registered', () => {
      expect(engine.hasAction('websocket')).toBe(true)
    })

    it('should have tts action registered', () => {
      expect(engine.hasAction('tts')).toBe(true)
    })

    it('should have overlay action registered', () => {
      expect(engine.hasAction('overlay')).toBe(true)
    })

    it('should have obs action registered', () => {
      expect(engine.hasAction('obs')).toBe(true)
    })

    it('should have game action registered', () => {
      expect(engine.hasAction('game')).toBe(true)
    })

    it('should return all registered types', () => {
      const types = engine.getRegisteredTypes()
      expect(types).toContain('keyboard')
      expect(types).toContain('sound')
      expect(types).toContain('websocket')
      expect(types).toContain('tts')
      expect(types).toContain('overlay')
      expect(types).toContain('obs')
      expect(types).toContain('game')
    })
  })

  describe('Custom Action Registration', () => {
    it('should register a custom action', () => {
      const mockAction = createMockAction('custom')
      engine.registerAction('custom', mockAction)

      expect(engine.hasAction('custom')).toBe(true)
    })

    it('should execute custom action', async () => {
      const mockAction = createMockAction('custom')
      engine.registerAction('custom', mockAction)

      await engine.execute('custom', {}, createMockEvent())

      expect(mockAction.validate).toHaveBeenCalled()
      expect(mockAction.execute).toHaveBeenCalled()
    })
  })

  describe('Action Execution', () => {
    it('should execute action with valid config', async () => {
      const mockAction = createMockAction('test')
      engine.registerAction('test', mockAction)

      const config = { key: 'F10' }
      await engine.execute('test', config, createMockEvent())

      expect(mockAction.validate).toHaveBeenCalledWith(config)
      expect(mockAction.execute).toHaveBeenCalledWith(config, expect.any(Object))
    })

    it('should skip execution if validation fails', async () => {
      const mockAction = createMockAction('test')
      mockAction.validate = vi.fn().mockReturnValue(false)
      engine.registerAction('test', mockAction)

      await engine.execute('test', {}, createMockEvent())

      expect(mockAction.validate).toHaveBeenCalled()
      expect(mockAction.execute).not.toHaveBeenCalled()
    })

    it('should handle missing action type', async () => {
      // Should not throw, just log warning
      await engine.execute('nonExistent', {}, createMockEvent())
    })
  })
})
