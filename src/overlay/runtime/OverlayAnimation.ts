import { OverlayAnimation } from './OverlayRuntime'
import { Logger } from '@services/logger'

const logger = new Logger('OverlayAnimation')

export type AnimationEasing = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic'

export interface AnimationFrame {
  timestamp: number
  progress: number
  value: number
}

/**
 * OverlayAnimationEngine - Animation engine for overlay objects
 */
export class OverlayAnimationEngine {
  private static instance: OverlayAnimationEngine
  private activeAnimations: Map<string, AnimationState> = new Map()

  private constructor() {}

  static getInstance(): OverlayAnimationEngine {
    if (!OverlayAnimationEngine.instance) {
      OverlayAnimationEngine.instance = new OverlayAnimationEngine()
    }
    return OverlayAnimationEngine.instance
  }

  /**
   * Start animation
   */
  startAnimation(
    objectId: string,
    animation: OverlayAnimation,
    onComplete?: () => void
  ): void {
    const state: AnimationState = {
      objectId,
      animation,
      startTime: performance.now(),
      progress: 0,
      complete: false
    }

    this.activeAnimations.set(objectId, state)
    logger.debug(`Animation started: ${animation.type} on ${objectId}`)
  }

  /**
   * Stop animation
   */
  stopAnimation(objectId: string): void {
    this.activeAnimations.delete(objectId)
  }

  /**
   * Update animations
   */
  update(currentTime: number): void {
    this.activeAnimations.forEach((state, objectId) => {
      if (state.complete) return

      const elapsed = currentTime - state.startTime
      const duration = state.animation.duration * 1000

      if (elapsed >= duration) {
        state.progress = 1
        state.complete = true
        this.activeAnimations.delete(objectId)
      } else {
        state.progress = elapsed / duration
      }
    })
  }

  /**
   * Get animation value
   */
  getAnimationValue(objectId: string, property: string, from: number, to: number): number {
    const state = this.activeAnimations.get(objectId)
    if (!state || state.complete) return to

    const easedProgress = this.applyEasing(state.progress, state.animation.easing || 'linear')
    return from + (to - from) * easedProgress
  }

  /**
   * Apply easing function
   */
  private applyEasing(t: number, easing: AnimationEasing): number {
    switch (easing) {
      case 'ease':
        return this.ease(t)
      case 'ease-in':
        return this.easeIn(t)
      case 'ease-out':
        return this.easeOut(t)
      case 'ease-in-out':
        return this.easeInOut(t)
      case 'bounce':
        return this.bounce(t)
      case 'elastic':
        return this.elastic(t)
      case 'linear':
      default:
        return t
    }
  }

  private ease(t: number): number {
    return t * t * (3 - 2 * t)
  }

  private easeIn(t: number): number {
    return t * t * t
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  private bounce(t: number): number {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  }

  private elastic(t: number): number {
    if (t === 0 || t === 1) return t
    return Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3))
  }

  /**
   * Fade animation
   */
  static fade(from: number, to: number, duration: number): OverlayAnimation {
    return { type: 'fade', duration, easing: 'ease' }
  }

  /**
   * Slide animation
   */
  static slide(direction: 'left' | 'right' | 'up' | 'down', duration: number): OverlayAnimation {
    return { type: `slide-${direction}`, duration, easing: 'ease-out' }
  }

  /**
   * Scale animation
   */
  static scale(from: number, to: number, duration: number): OverlayAnimation {
    return { type: 'scale', duration, easing: 'elastic' }
  }

  /**
   * Rotate animation
   */
  static rotate(from: number, to: number, duration: number): OverlayAnimation {
    return { type: 'rotate', duration, easing: 'linear' }
  }

  /**
   * Bounce animation
   */
  static bounce(duration: number): OverlayAnimation {
    return { type: 'bounce', duration, easing: 'bounce' }
  }

  /**
   * Shake animation
   */
  static shake(duration: number): OverlayAnimation {
    return { type: 'shake', duration, easing: 'linear' }
  }
}

interface AnimationState {
  objectId: string
  animation: OverlayAnimation
  startTime: number
  progress: number
  complete: boolean
}
