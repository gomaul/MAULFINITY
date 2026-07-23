import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import { EditorObject, Point, Rect } from './types'

const logger = new Logger('SelectionManager')

/**
 * SelectionManager - Manages object selection in the editor
 */
export class SelectionManager extends EventEmitter {
  private static instance: SelectionManager
  private selectedIds: Set<string> = new Set()
  private objects: EditorObject[] = []

  private constructor() {
    super()
  }

  static getInstance(): SelectionManager {
    if (!SelectionManager.instance) {
      SelectionManager.instance = new SelectionManager()
    }
    return SelectionManager.instance
  }

  /**
   * Set objects for selection
   */
  setObjects(objects: EditorObject[]): void {
    this.objects = objects
  }

  /**
   * Select single object
   */
  select(objectId: string, addToSelection = false): void {
    if (!addToSelection) {
      this.selectedIds.clear()
    }
    this.selectedIds.add(objectId)
    this.emit('selectionChanged', this.getSelectedIds())
  }

  /**
   * Deselect object
   */
  deselect(objectId: string): void {
    this.selectedIds.delete(objectId)
    this.emit('selectionChanged', this.getSelectedIds())
  }

  /**
   * Toggle selection
   */
  toggleSelection(objectId: string): void {
    if (this.selectedIds.has(objectId)) {
      this.deselect(objectId)
    } else {
      this.select(objectId, true)
    }
  }

  /**
   * Select all objects
   */
  selectAll(): void {
    this.objects.forEach(obj => this.selectedIds.add(obj.id))
    this.emit('selectionChanged', this.getSelectedIds())
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedIds.clear()
    this.emit('selectionChanged', [])
  }

  /**
   * Select objects in box
   */
  selectInBox(box: Rect): void {
    this.selectedIds.clear()
    
    for (const obj of this.objects) {
      if (this.isObjectInBox(obj, box)) {
        this.selectedIds.add(obj.id)
      }
    }
    
    this.emit('selectionChanged', this.getSelectedIds())
  }

  /**
   * Check if object is in box
   */
  private isObjectInBox(obj: EditorObject, box: Rect): boolean {
    const objRect: Rect = {
      x: obj.transform.position.x,
      y: obj.transform.position.y,
      width: obj.transform.size.width,
      height: obj.transform.size.height
    }

    return !(
      objRect.x > box.x + box.width ||
      objRect.x + objRect.width < box.x ||
      objRect.y > box.y + box.height ||
      objRect.y + objRect.height < box.y
    )
  }

  /**
   * Get selected object IDs
   */
  getSelectedIds(): string[] {
    return Array.from(this.selectedIds)
  }

  /**
   * Get selected objects
   */
  getSelectedObjects(): EditorObject[] {
    return this.objects.filter(obj => this.selectedIds.has(obj.id))
  }

  /**
   * Check if object is selected
   */
  isSelected(objectId: string): boolean {
    return this.selectedIds.has(objectId)
  }

  /**
   * Get selection count
   */
  getSelectionCount(): number {
    return this.selectedIds.size
  }

  /**
   * Find object at point
   */
  findObjectAtPoint(point: Point): EditorObject | null {
    // Search from top to bottom (highest zIndex first)
    const sorted = [...this.objects].sort((a, b) => b.zIndex - a.zIndex)

    for (const obj of sorted) {
      if (!obj.visible || obj.locked) continue
      if (this.isPointInObject(point, obj)) {
        return obj
      }
    }

    return null
  }

  /**
   * Check if point is in object
   */
  private isPointInObject(point: Point, obj: EditorObject): boolean {
    return (
      point.x >= obj.transform.position.x &&
      point.x <= obj.transform.position.x + obj.transform.size.width &&
      point.y >= obj.transform.position.y &&
      point.y <= obj.transform.position.y + obj.transform.size.height
    )
  }

  /**
   * Find object at point (respecting locked state)
   */
  findObjectAtPointUnlocked(point: Point): EditorObject | null {
    const sorted = [...this.objects].sort((a, b) => b.zIndex - a.zIndex)

    for (const obj of sorted) {
      if (!obj.visible) continue
      if (this.isPointInObject(point, obj)) {
        return obj
      }
    }

    return null
  }
}
