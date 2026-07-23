import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import { EditorObject, Point, Transform } from './types'

const logger = new Logger('TransformManager')

export type TransformHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate'

/**
 * TransformManager - Handles object transformations (move, resize, rotate)
 */
export class TransformManager extends EventEmitter {
  private static instance: TransformManager
  private objects: EditorObject[] = []
  private activeHandle: TransformHandle | null = null
  private startPoint: Point = { x: 0, y: 0 }
  private startTransform: Transform | null = null

  private constructor() {
    super()
  }

  static getInstance(): TransformManager {
    if (!TransformManager.instance) {
      TransformManager.instance = new TransformManager()
    }
    return TransformManager.instance
  }

  /**
   * Set objects
   */
  setObjects(objects: EditorObject[]): void {
    this.objects = objects
  }

  /**
   * Start transform
   */
  startTransform(
    objectId: string,
    handle: TransformHandle,
    startPoint: Point
  ): void {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj) return

    this.activeHandle = handle
    this.startPoint = startPoint
    this.startTransform = { ...obj.transform }

    logger.debug(`Transform started: ${handle} on ${objectId}`)
  }

  /**
   * Update transform
   */
  updateTransform(
    objectId: string,
    currentPoint: Point
  ): void {
    if (!this.activeHandle || !this.startTransform) return

    const obj = this.objects.find(o => o.id === objectId)
    if (!obj) return

    const deltaX = currentPoint.x - this.startPoint.x
    const deltaY = currentPoint.y - this.startPoint.y

    switch (this.activeHandle) {
      case 'nw':
        obj.transform.position.x = this.startTransform.position.x + deltaX
        obj.transform.position.y = this.startTransform.position.y + deltaY
        obj.transform.size.width = this.startTransform.size.width - deltaX
        obj.transform.size.height = this.startTransform.size.height - deltaY
        break

      case 'n':
        obj.transform.position.y = this.startTransform.position.y + deltaY
        obj.transform.size.height = this.startTransform.size.height - deltaY
        break

      case 'ne':
        obj.transform.position.y = this.startTransform.position.y + deltaY
        obj.transform.size.width = this.startTransform.size.width + deltaX
        obj.transform.size.height = this.startTransform.size.height - deltaY
        break

      case 'e':
        obj.transform.size.width = this.startTransform.size.width + deltaX
        break

      case 'se':
        obj.transform.size.width = this.startTransform.size.width + deltaX
        obj.transform.size.height = this.startTransform.size.height + deltaY
        break

      case 's':
        obj.transform.size.height = this.startTransform.size.height + deltaY
        break

      case 'sw':
        obj.transform.position.x = this.startTransform.position.x + deltaX
        obj.transform.size.width = this.startTransform.size.width - deltaX
        obj.transform.size.height = this.startTransform.size.height + deltaY
        break

      case 'w':
        obj.transform.position.x = this.startTransform.position.x + deltaX
        obj.transform.size.width = this.startTransform.size.width - deltaX
        break

      case 'rotate':
        const centerX = this.startTransform.position.x + this.startTransform.size.width / 2
        const centerY = this.startTransform.position.y + this.startTransform.size.height / 2
        const angle = Math.atan2(
          currentPoint.y - centerY,
          currentPoint.x - centerX
        ) - Math.atan2(
          this.startPoint.y - centerY,
          this.startPoint.x - centerX
        )
        obj.transform.rotation = this.startTransform.rotation + (angle * 180) / Math.PI
        break
    }

    // Ensure minimum size
    obj.transform.size.width = Math.max(10, obj.transform.size.width)
    obj.transform.size.height = Math.max(10, obj.transform.size.height)

    this.emit('transformUpdated', obj)
  }

  /**
   * End transform
   */
  endTransform(): void {
    if (this.activeHandle) {
      logger.debug('Transform ended')
      this.activeHandle = null
      this.startTransform = null
      this.emit('transformComplete')
    }
  }

  /**
   * Move object
   */
  moveObject(objectId: string, delta: Point): void {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj || obj.locked) return

    obj.transform.position.x += delta.x
    obj.transform.position.y += delta.y

    this.emit('transformUpdated', obj)
  }

  /**
   * Resize object
   */
  resizeObject(objectId: string, width: number, height: number): void {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj || obj.locked) return

    obj.transform.size.width = Math.max(10, width)
    obj.transform.size.height = Math.max(10, height)

    this.emit('transformUpdated', obj)
  }

  /**
   * Rotate object
   */
  rotateObject(objectId: string, rotation: number): void {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj || obj.locked) return

    obj.transform.rotation = rotation % 360

    this.emit('transformUpdated', obj)
  }

  /**
   * Set position
   */
  setPosition(objectId: string, position: Point): void {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj || obj.locked) return

    obj.transform.position = { ...position }

    this.emit('transformUpdated', obj)
  }

  /**
   * Set size
   */
  setSize(objectId: string, width: number, height: number): void {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj || obj.locked) return

    obj.transform.size = {
      width: Math.max(10, width),
      height: Math.max(10, height)
    }

    this.emit('transformUpdated', obj)
  }

  /**
   * Set rotation
   */
  setRotation(objectId: string, rotation: number): void {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj || obj.locked) return

    obj.transform.rotation = rotation

    this.emit('transformUpdated', obj)
  }

  /**
   * Set opacity
   */
  setOpacity(objectId: string, opacity: number): void {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj) return

    obj.opacity = Math.max(0, Math.min(1, opacity))

    this.emit('transformUpdated', obj)
  }

  /**
   * Set visibility
   */
  setVisibility(objectId: string, visible: boolean): void {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj) return

    obj.visible = visible

    this.emit('transformUpdated', obj)
  }

  /**
   * Set locked
   */
  setLocked(objectId: string, locked: boolean): void {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj) return

    obj.locked = locked

    this.emit('transformUpdated', obj)
  }

  /**
   * Get handle at point
   */
  getHandleAtPoint(point: Point, objectId: string): TransformHandle | null {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj) return null

    const handleSize = 8
    const handles = this.getHandlePositions(obj)

    for (const [handle, pos] of Object.entries(handles)) {
      if (
        point.x >= pos.x - handleSize &&
        point.x <= pos.x + handleSize &&
        point.y >= pos.y - handleSize &&
        point.y <= pos.y + handleSize
      ) {
        return handle as TransformHandle
      }
    }

    // Check rotation handle (above top center)
    const rotateHandle = {
      x: obj.transform.position.x + obj.transform.size.width / 2,
      y: obj.transform.position.y - 20
    }

    if (
      point.x >= rotateHandle.x - handleSize &&
      point.x <= rotateHandle.x + handleSize &&
      point.y >= rotateHandle.y - handleSize &&
      point.y <= rotateHandle.y + handleSize
    ) {
      return 'rotate'
    }

    return null
  }

  /**
   * Get handle positions
   */
  getHandlePositions(obj: EditorObject): Record<string, Point> {
    return {
      nw: { x: obj.transform.position.x, y: obj.transform.position.y },
      n: { x: obj.transform.position.x + obj.transform.size.width / 2, y: obj.transform.position.y },
      ne: { x: obj.transform.position.x + obj.transform.size.width, y: obj.transform.position.y },
      e: { x: obj.transform.position.x + obj.transform.size.width, y: obj.transform.position.y + obj.transform.size.height / 2 },
      se: { x: obj.transform.position.x + obj.transform.size.width, y: obj.transform.position.y + obj.transform.size.height },
      s: { x: obj.transform.position.x + obj.transform.size.width / 2, y: obj.transform.position.y + obj.transform.size.height },
      sw: { x: obj.transform.position.x, y: obj.transform.position.y + obj.transform.size.height },
      w: { x: obj.transform.position.x, y: obj.transform.position.y + obj.transform.size.height / 2 }
    }
  }
}
