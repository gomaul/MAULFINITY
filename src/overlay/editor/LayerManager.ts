import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import { EditorObject, LayerInfo } from './types'

const logger = new Logger('LayerManager')

/**
 * LayerManager - Manages layer hierarchy and operations
 */
export class LayerManager extends EventEmitter {
  private static instance: LayerManager
  private objects: EditorObject[] = []

  private constructor() {
    super()
  }

  static getInstance(): LayerManager {
    if (!LayerManager.instance) {
      LayerManager.instance = new LayerManager()
    }
    return LayerManager.instance
  }

  /**
   * Set objects
   */
  setObjects(objects: EditorObject[]): void {
    this.objects = objects
  }

  /**
   * Get layer info
   */
  getLayers(): LayerInfo[] {
    return this.objects.map(obj => ({
      id: obj.id,
      name: obj.name,
      visible: obj.visible,
      locked: obj.locked,
      opacity: obj.opacity,
      objectCount: 1
    }))
  }

  /**
   * Reorder layer
   */
  reorderLayer(objectId: string, newIndex: number): void {
    const objIndex = this.objects.findIndex(o => o.id === objectId)
    if (objIndex === -1) return

    const [obj] = this.objects.splice(objIndex, 1)
    this.objects.splice(newIndex, 0, obj)

    // Update zIndices
    this.updateZIndices()

    logger.debug(`Layer reordered: ${objectId} to index ${newIndex}`)
    this.emit('layersChanged')
  }

  /**
   * Move layer up
   */
  moveUp(objectId: string): void {
    const index = this.objects.findIndex(o => o.id === objectId)
    if (index === -1 || index === this.objects.length - 1) return

    // Swap with next
    const temp = this.objects[index]
    this.objects[index] = this.objects[index + 1]
    this.objects[index + 1] = temp

    this.updateZIndices()
    this.emit('layersChanged')
  }

  /**
   * Move layer down
   */
  moveDown(objectId: string): void {
    const index = this.objects.findIndex(o => o.id === objectId)
    if (index <= 0) return

    // Swap with previous
    const temp = this.objects[index]
    this.objects[index] = this.objects[index - 1]
    this.objects[index - 1] = temp

    this.updateZIndices()
    this.emit('layersChanged')
  }

  /**
   * Move to top
   */
  moveToTop(objectId: string): void {
    const index = this.objects.findIndex(o => o.id === objectId)
    if (index === -1 || index === this.objects.length - 1) return

    const [obj] = this.objects.splice(index, 1)
    this.objects.push(obj)

    this.updateZIndices()
    this.emit('layersChanged')
  }

  /**
   * Move to bottom
   */
  moveToBottom(objectId: string): void {
    const index = this.objects.findIndex(o => o.id === objectId)
    if (index <= 0) return

    const [obj] = this.objects.splice(index, 1)
    this.objects.unshift(obj)

    this.updateZIndices()
    this.emit('layersChanged')
  }

  /**
   * Update zIndices based on array order
   */
  private updateZIndices(): void {
    this.objects.forEach((obj, index) => {
      obj.zIndex = index
    })
  }

  /**
   * Toggle visibility
   */
  toggleVisibility(objectId: string): void {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj) return

    obj.visible = !obj.visible
    logger.debug(`Visibility toggled: ${objectId} = ${obj.visible}`)
    this.emit('layersChanged')
  }

  /**
   * Toggle lock
   */
  toggleLock(objectId: string): void {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj) return

    obj.locked = !obj.locked
    logger.debug(`Lock toggled: ${objectId} = ${obj.locked}`)
    this.emit('layersChanged')
  }

  /**
   * Duplicate layer
   */
  duplicateLayer(objectId: string): EditorObject | null {
    const obj = this.objects.find(o => o.id === objectId)
    if (!obj) return null

    const duplicate: EditorObject = {
      ...JSON.parse(JSON.stringify(obj)),
      id: this.generateId(),
      name: `${obj.name} Copy`,
      transform: {
        ...obj.transform,
        position: {
          x: obj.transform.position.x + 20,
          y: obj.transform.position.y + 20
        }
      }
    }

    this.objects.push(duplicate)
    this.updateZIndices()

    logger.debug(`Layer duplicated: ${objectId}`)
    this.emit('layersChanged')

    return duplicate
  }

  /**
   * Delete layer
   */
  deleteLayer(objectId: string): void {
    const index = this.objects.findIndex(o => o.id === objectId)
    if (index === -1) return

    this.objects.splice(index, 1)
    this.updateZIndices()

    logger.debug(`Layer deleted: ${objectId}`)
    this.emit('layersChanged')
  }

  /**
   * Group layers
   */
  groupLayers(objectIds: string[]): EditorObject | null {
    if (objectIds.length < 2) return null

    const objects = this.objects.filter(o => objectIds.includes(o.id))
    if (objects.length < 2) return null

    // Calculate bounding box
    const minX = Math.min(...objects.map(o => o.transform.position.x))
    const minY = Math.min(...objects.map(o => o.transform.position.y))
    const maxX = Math.max(...objects.map(o => o.transform.position.x + o.transform.size.width))
    const maxY = Math.max(...objects.map(o => o.transform.position.y + o.transform.size.height))

    // Create container
    const container: EditorObject = {
      id: this.generateId(),
      type: 'container',
      name: 'Group',
      transform: {
        position: { x: minX, y: minY },
        size: { width: maxX - minX, height: maxY - minY },
        rotation: 0,
        scale: { x: 1, y: 1 },
        anchor: { x: 0, y: 0 }
      },
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: 0,
      config: { children: objectIds }
    }

    // Remove grouped objects and add container
    this.objects = this.objects.filter(o => !objectIds.includes(o.id))
    this.objects.push(container)
    this.updateZIndices()

    logger.debug(`Layers grouped: ${objectIds.length} objects`)
    this.emit('layersChanged')

    return container
  }

  /**
   * Ungroup layers
   */
  ungroupLayers(containerId: string): EditorObject[] {
    const container = this.objects.find(o => o.id === containerId)
    if (!container || container.type !== 'container') return []

    const childIds = container.config.children as string[]
    const children = this.objects.filter(o => childIds.includes(o.id))

    // Remove container and add children
    this.objects = this.objects.filter(o => o.id !== containerId)
    this.objects.push(...children)
    this.updateZIndices()

    logger.debug(`Layers ungrouped: ${children.length} objects`)
    this.emit('layersChanged')

    return children
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
