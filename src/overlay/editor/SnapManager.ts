import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import { Point, EditorObject } from './types'

const logger = new Logger('SnapManager')

export interface SnapGuide {
  type: 'horizontal' | 'vertical'
  position: number
  start: Point
  end: Point
}

/**
 * SnapManager - Manages snap guides and snapping behavior
 */
export class SnapManager extends EventEmitter {
  private static instance: SnapManager
  private guides: SnapGuide[] = []
  private snapThreshold: number = 5
  private showGuides: boolean = true

  private constructor() {
    super()
  }

  static getInstance(): SnapManager {
    if (!SnapManager.instance) {
      SnapManager.instance = new SnapManager()
    }
    return SnapManager.instance
  }

  /**
   * Calculate snap position
   */
  calculateSnap(
    object: EditorObject,
    objects: EditorObject[],
    canvasWidth: number,
    canvasHeight: number
  ): { position: Point; guides: SnapGuide[] } {
    this.guides = []

    const objectCenter = {
      x: object.transform.position.x + object.transform.size.width / 2,
      y: object.transform.position.y + object.transform.size.height / 2
    }

    let snappedX = object.transform.position.x
    let snappedY = object.transform.position.y

    // Snap to canvas center
    const canvasCenterX = canvasWidth / 2
    const canvasCenterY = canvasHeight / 2

    if (Math.abs(objectCenter.x - canvasCenterX) < this.snapThreshold) {
      snappedX = canvasCenterX - object.transform.size.width / 2
      this.guides.push({
        type: 'vertical',
        position: canvasCenterX,
        start: { x: canvasCenterX, y: 0 },
        end: { x: canvasCenterX, y: canvasHeight }
      })
    }

    if (Math.abs(objectCenter.y - canvasCenterY) < this.snapThreshold) {
      snappedY = canvasCenterY - object.transform.size.height / 2
      this.guides.push({
        type: 'horizontal',
        position: canvasCenterY,
        start: { x: 0, y: canvasCenterY },
        end: { x: canvasWidth, y: canvasCenterY }
      })
    }

    // Snap to other objects
    for (const other of objects) {
      if (other.id === object.id) continue

      const otherCenter = {
        x: other.transform.position.x + other.transform.size.width / 2,
        y: other.transform.position.y + other.transform.size.height / 2
      }

      // Snap to center X
      if (Math.abs(objectCenter.x - otherCenter.x) < this.snapThreshold) {
        snappedX = otherCenter.x - object.transform.size.width / 2
        this.guides.push({
          type: 'vertical',
          position: otherCenter.x,
          start: { x: otherCenter.x, y: Math.min(object.transform.position.y, other.transform.position.y) },
          end: { x: otherCenter.x, y: Math.max(object.transform.position.y + object.transform.size.height, other.transform.position.y + other.transform.size.height) }
        })
      }

      // Snap to center Y
      if (Math.abs(objectCenter.y - otherCenter.y) < this.snapThreshold) {
        snappedY = otherCenter.y - object.transform.size.height / 2
        this.guides.push({
          type: 'horizontal',
          position: otherCenter.y,
          start: { x: Math.min(object.transform.position.x, other.transform.position.x), y: otherCenter.y },
          end: { x: Math.max(object.transform.position.x + object.transform.size.width, other.transform.position.x + other.transform.size.width), y: otherCenter.y }
        })
      }

      // Snap to edges
      const edges = this.getEdges(object, other)
      for (const edge of edges) {
        if (edge.distance < this.snapThreshold) {
          if (edge.type === 'left' || edge.type === 'right') {
            snappedX = edge.snapPosition
            this.guides.push({
              type: 'vertical',
              position: edge.snapPosition,
              start: { x: edge.snapPosition, y: Math.min(object.transform.position.y, other.transform.position.y) },
              end: { x: edge.snapPosition, y: Math.max(object.transform.position.y + object.transform.size.height, other.transform.position.y + other.transform.size.height) }
            })
          } else {
            snappedY = edge.snapPosition
            this.guides.push({
              type: 'horizontal',
              position: edge.snapPosition,
              start: { x: Math.min(object.transform.position.x, other.transform.position.x), y: edge.snapPosition },
              end: { x: Math.max(object.transform.position.x + object.transform.size.width, other.transform.position.x + other.transform.size.width), y: edge.snapPosition }
            })
          }
        }
      }
    }

    return { position: { x: snappedX, y: snappedY }, guides: this.guides }
  }

  /**
   * Get edges for snapping
   */
  private getEdges(
    object: EditorObject,
    other: EditorObject
  ): Array<{ type: string; distance: number; snapPosition: number }> {
    const edges: Array<{ type: string; distance: number; snapPosition: number }> = []

    const objLeft = object.transform.position.x
    const objRight = object.transform.position.x + object.transform.size.width
    const objTop = object.transform.position.y
    const objBottom = object.transform.position.y + object.transform.size.height

    const otherLeft = other.transform.position.x
    const otherRight = other.transform.position.x + other.transform.size.width
    const otherTop = other.transform.position.y
    const otherBottom = other.transform.position.y + other.transform.size.height

    // Left to left
    edges.push({ type: 'left', distance: Math.abs(objLeft - otherLeft), snapPosition: otherLeft })
    // Left to right
    edges.push({ type: 'left', distance: Math.abs(objLeft - otherRight), snapPosition: otherRight })
    // Right to left
    edges.push({ type: 'right', distance: Math.abs(objRight - otherLeft), snapPosition: otherLeft - object.transform.size.width })
    // Right to right
    edges.push({ type: 'right', distance: Math.abs(objRight - otherRight), snapPosition: otherRight - object.transform.size.width })

    // Top to top
    edges.push({ type: 'top', distance: Math.abs(objTop - otherTop), snapPosition: otherTop })
    // Top to bottom
    edges.push({ type: 'top', distance: Math.abs(objTop - otherBottom), snapPosition: otherBottom })
    // Bottom to top
    edges.push({ type: 'bottom', distance: Math.abs(objBottom - otherTop), snapPosition: otherTop - object.transform.size.height })
    // Bottom to bottom
    edges.push({ type: 'bottom', distance: Math.abs(objBottom - otherBottom), snapPosition: otherBottom - object.transform.size.height })

    return edges
  }

  /**
   * Get current guides
   */
  getGuides(): SnapGuide[] {
    return [...this.guides]
  }

  /**
   * Clear guides
   */
  clearGuides(): void {
    this.guides = []
  }

  /**
   * Set show guides
   */
  setShowGuides(show: boolean): void {
    this.showGuides = show
  }

  /**
   * Check if guides should be shown
   */
  isShowGuides(): boolean {
    return this.showGuides
  }
}
