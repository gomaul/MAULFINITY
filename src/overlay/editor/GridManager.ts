import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import { Point } from './types'

const logger = new Logger('GridManager')

/**
 * GridManager - Manages grid and snap functionality
 */
export class GridManager extends EventEmitter {
  private static instance: GridManager
  private gridSize: number = 20
  private snapEnabled: boolean = true
  private snapThreshold: number = 10

  private constructor() {
    super()
  }

  static getInstance(): GridManager {
    if (!GridManager.instance) {
      GridManager.instance = new GridManager()
    }
    return GridManager.instance
  }

  /**
   * Set grid size
   */
  setGridSize(size: number): void {
    this.gridSize = size
    this.emit('gridChanged', size)
  }

  /**
   * Get grid size
   */
  getGridSize(): number {
    return this.gridSize
  }

  /**
   * Enable/disable snap
   */
  setSnapEnabled(enabled: boolean): void {
    this.snapEnabled = enabled
  }

  /**
   * Check if snap is enabled
   */
  isSnapEnabled(): boolean {
    return this.snapEnabled
  }

  /**
   * Snap point to grid
   */
  snapToGrid(point: Point): Point {
    if (!this.snapEnabled) return point

    return {
      x: Math.round(point.x / this.gridSize) * this.gridSize,
      y: Math.round(point.y / this.gridSize) * this.gridSize
    }
  }

  /**
   * Snap to nearest object edge
   */
  snapToObjects(
    point: Point,
    objects: Array<{ id: string; x: number; y: number; width: number; height: number }>,
    excludeId?: string
  ): Point {
    if (!this.snapEnabled) return point

    let snappedX = point.x
    let snappedY = point.y
    let minDistX = this.snapThreshold
    let minDistY = this.snapThreshold

    for (const obj of objects) {
      if (obj.id === excludeId) continue

      // Check horizontal edges
      const edgesX = [obj.x, obj.x + obj.width]
      for (const edgeX of edgesX) {
        const dist = Math.abs(point.x - edgeX)
        if (dist < minDistX) {
          minDistX = dist
          snappedX = edgeX
        }
      }

      // Check vertical edges
      const edgesY = [obj.y, obj.y + obj.height]
      for (const edgeY of edgesY) {
        const dist = Math.abs(point.y - edgeY)
        if (dist < minDistY) {
          minDistY = dist
          snappedY = edgeY
        }
      }
    }

    return { x: snappedX, y: snappedY }
  }

  /**
   * Snap to center
   */
  snapToCenter(
    point: Point,
    objects: Array<{ id: string; x: number; y: number; width: number; height: number }>,
    excludeId?: string
  ): Point {
    if (!this.snapEnabled) return point

    let snappedX = point.x
    let snappedY = point.y
    let minDistX = this.snapThreshold
    let minDistY = this.snapThreshold

    for (const obj of objects) {
      if (obj.id === excludeId) continue

      const centerX = obj.x + obj.width / 2
      const centerY = obj.y + obj.height / 2

      const distX = Math.abs(point.x - centerX)
      if (distX < minDistX) {
        minDistX = distX
        snappedX = centerX
      }

      const distY = Math.abs(point.y - centerY)
      if (distY < minDistY) {
        minDistY = distY
        snappedY = centerY
      }
    }

    return { x: snappedX, y: snappedY }
  }

  /**
   * Get grid lines for rendering
   */
  getGridLines(width: number, height: number): Point[][] {
    const lines: Point[][] = []

    // Vertical lines
    for (let x = 0; x <= width; x += this.gridSize) {
      lines.push([{ x, y: 0 }, { x, y: height }])
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += this.gridSize) {
      lines.push([{ x: 0, y }, { x: width, y }])
    }

    return lines
  }
}
