import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import { EditorCanvas } from './canvas/EditorCanvas'
import { SelectionManager } from './SelectionManager'
import { TransformManager } from './TransformManager'
import { HistoryManager } from './HistoryManager'
import { LayerManager } from './LayerManager'
import { ClipboardManager } from './ClipboardManager'
import { GridManager } from './GridManager'
import { SnapManager } from './SnapManager'
import { InspectorManager } from './InspectorManager'
import { 
  EditorScene, EditorObject, EditorViewport, EditorMode,
  MaulOverlayFile, OverlayMetadata 
} from './types'

const logger = new Logger('OverlayEditor')

/**
 * OverlayEditor - Main orchestrator for the visual overlay editor
 * 
 * Responsibilities:
 * - Coordinate all editor managers
 * - Handle scene operations
 * - Save/load overlay files
 * - Undo/redo operations
 */
export class OverlayEditor extends EventEmitter {
  private static instance: OverlayEditor
  
  // Managers
  private canvas: EditorCanvas
  private selection: SelectionManager
  private transform: TransformManager
  private history: HistoryManager
  private layers: LayerManager
  private clipboard: ClipboardManager
  private grid: GridManager
  private snap: SnapManager
  private inspector: InspectorManager

  // State
  private scene: EditorScene | null = null
  private sceneId: string | null = null
  private isDirty: boolean = false

  private constructor() {
    super()
    
    // Initialize managers
    this.canvas = new EditorCanvas()
    this.selection = SelectionManager.getInstance()
    this.transform = TransformManager.getInstance()
    this.history = HistoryManager.getInstance()
    this.layers = LayerManager.getInstance()
    this.clipboard = ClipboardManager.getInstance()
    this.grid = GridManager.getInstance()
    this.snap = SnapManager.getInstance()
    this.inspector = InspectorManager.getInstance()

    this.setupEventListeners()
  }

  static getInstance(): OverlayEditor {
    if (!OverlayEditor.instance) {
      OverlayEditor.instance = new OverlayEditor()
    }
    return OverlayEditor.instance
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Canvas events
    this.canvas.on('mouseDown', this.handleMouseDown.bind(this))
    this.canvas.on('mouseMove', this.handleMouseMove.bind(this))
    this.canvas.on('mouseUp', this.handleMouseUp.bind(this))
    this.canvas.on('keyDown', this.handleKeyDown.bind(this))

    // Selection events
    this.selection.on('selectionChanged', this.handleSelectionChanged.bind(this))

    // History events
    this.history.on('undo', this.handleUndo.bind(this))
    this.history.on('redo', this.handleRedo.bind(this))
  }

  /**
   * Initialize editor with canvas element
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas.initialize(canvas)
    logger.info('Overlay editor initialized')
  }

  /**
   * Create new scene
   */
  createScene(name: string, width: number = 1920, height: number = 1080): EditorScene {
    const scene: EditorScene = {
      id: this.generateId(),
      name,
      width,
      height,
      backgroundColor: '#000000',
      backgroundOpacity: 1,
      objects: [],
      settings: {
        showGrid: true,
        gridSize: 20,
        snapToGrid: true,
        showSafeArea: true,
        safeAreaMargin: 50
      }
    }

    this.scene = scene
    this.sceneId = scene.id
    this.isDirty = false

    this.canvas.setScene(scene)
    this.layers.setObjects(scene.objects)
    this.selection.setObjects(scene.objects)

    this.emit('sceneCreated', scene)
    logger.info(`Scene created: ${name}`)

    return scene
  }

  /**
   * Load scene
   */
  loadScene(scene: EditorScene, sceneId?: string): void {
    this.scene = scene
    this.sceneId = sceneId || scene.id
    this.isDirty = false

    this.canvas.setScene(scene)
    this.layers.setObjects(scene.objects)
    this.selection.setObjects(scene.objects)
    this.selection.clearSelection()

    this.emit('sceneLoaded', scene)
    logger.info(`Scene loaded: ${scene.name}`)
  }

  /**
   * Get current scene
   */
  getScene(): EditorScene | null {
    return this.scene
  }

  /**
   * Get scene ID
   */
  getSceneId(): string | null {
    return this.sceneId
  }

  /**
   * Add object to scene
   */
  addObject(type: EditorObject['type'], config: Record<string, unknown> = {}): EditorObject {
    if (!this.scene) {
      throw new Error('No scene loaded')
    }

    const object: EditorObject = {
      id: this.generateId(),
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${this.scene.objects.length + 1}`,
      transform: {
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        anchor: { x: 0, y: 0 }
      },
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: this.scene.objects.length,
      config
    }

    this.scene.objects.push(object)
    this.isDirty = true

    // Update managers
    this.layers.setObjects(this.scene.objects)
    this.selection.setObjects(this.scene.objects)
    this.transform.setObjects(this.scene.objects)

    // Add to history
    this.history.addEntry({
      type: 'add',
      data: object
    })

    this.emit('objectAdded', object)
    logger.info(`Object added: ${object.name}`)

    return object
  }

  /**
   * Remove object from scene
   */
  removeObject(objectId: string): void {
    if (!this.scene) return

    const index = this.scene.objects.findIndex(o => o.id === objectId)
    if (index === -1) return

    const object = this.scene.objects[index]
    this.scene.objects.splice(index, 1)
    this.isDirty = true

    // Update managers
    this.layers.setObjects(this.scene.objects)
    this.selection.setObjects(this.scene.objects)
    this.transform.setObjects(this.scene.objects)
    this.selection.deselect(objectId)

    // Add to history
    this.history.addEntry({
      type: 'remove',
      data: object
    })

    this.emit('objectRemoved', object)
    logger.info(`Object removed: ${object.name}`)
  }

  /**
   * Duplicate object
   */
  duplicateObject(objectId: string): EditorObject | null {
    if (!this.scene) return null

    const original = this.scene.objects.find(o => o.id === objectId)
    if (!original) return null

    const duplicate: EditorObject = {
      ...JSON.parse(JSON.stringify(original)),
      id: this.generateId(),
      name: `${original.name} Copy`,
      transform: {
        ...original.transform,
        position: {
          x: original.transform.position.x + 20,
          y: original.transform.position.y + 20
        }
      }
    }

    this.scene.objects.push(duplicate)
    this.isDirty = true

    // Update managers
    this.layers.setObjects(this.scene.objects)
    this.selection.setObjects(this.scene.objects)
    this.transform.setObjects(this.scene.objects)

    // Add to history
    this.history.addEntry({
      type: 'add',
      data: duplicate
    })

    this.emit('objectAdded', duplicate)
    logger.info(`Object duplicated: ${duplicate.name}`)

    return duplicate
  }

  /**
   * Update object property
   */
  updateObject(objectId: string, updates: Partial<EditorObject>): void {
    if (!this.scene) return

    const object = this.scene.objects.find(o => o.id === objectId)
    if (!object) return

    const oldData = JSON.parse(JSON.stringify(object))

    // Apply updates
    if (updates.name !== undefined) object.name = updates.name
    if (updates.transform !== undefined) object.transform = updates.transform
    if (updates.opacity !== undefined) object.opacity = updates.opacity
    if (updates.visible !== undefined) object.visible = updates.visible
    if (updates.locked !== undefined) object.locked = updates.locked
    if (updates.config !== undefined) object.config = updates.config
    if (updates.animation !== undefined) object.animation = updates.animation

    this.isDirty = true

    // Add to history
    this.history.addEntry({
      type: 'update',
      data: { objectId, updates },
      undoData: oldData
    })

    this.emit('objectUpdated', object)
  }

  /**
   * Copy selected objects
   */
  copySelected(): void {
    const selected = this.selection.getSelectedObjects()
    if (selected.length > 0) {
      this.clipboard.copy(selected)
    }
  }

  /**
   * Cut selected objects
   */
  cutSelected(): void {
    const selected = this.selection.getSelectedObjects()
    if (selected.length > 0) {
      this.clipboard.cut(selected)
      selected.forEach(obj => this.removeObject(obj.id))
    }
  }

  /**
   * Paste objects
   */
  paste(): void {
    if (!this.scene) return

    const objects = this.clipboard.paste()
    objects.forEach(obj => {
      this.scene!.objects.push(obj)
    })

    this.isDirty = true
    this.layers.setObjects(this.scene.objects)
    this.selection.setObjects(this.scene.objects)
    this.transform.setObjects(this.scene.objects)

    // Select pasted objects
    this.selection.clearSelection()
    objects.forEach(obj => this.selection.select(obj.id, true))
  }

  /**
   * Undo
   */
  undo(): void {
    this.history.undo()
  }

  /**
   * Redo
   */
  redo(): void {
    this.history.redo()
  }

  /**
   * Handle undo action
   */
  private handleUndo(entry: { type: string; data: unknown; undoData?: unknown }): void {
    if (!this.scene) return

    switch (entry.type) {
      case 'add':
        // Remove the added object
        const addData = entry.data as EditorObject
        const addIndex = this.scene.objects.findIndex(o => o.id === addData.id)
        if (addIndex !== -1) {
          this.scene.objects.splice(addIndex, 1)
        }
        break

      case 'remove':
        // Re-add the removed object
        const removeData = entry.data as EditorObject
        this.scene.objects.push(removeData)
        break

      case 'update':
        // Restore old data
        const updateData = entry.data as { objectId: string }
        const undoData = entry.undoData as EditorObject
        const objIndex = this.scene.objects.findIndex(o => o.id === updateData.objectId)
        if (objIndex !== -1) {
          this.scene.objects[objIndex] = undoData
        }
        break
    }

    this.isDirty = true
    this.layers.setObjects(this.scene.objects)
    this.selection.setObjects(this.scene.objects)
    this.transform.setObjects(this.scene.objects)
  }

  /**
   * Handle redo action
   */
  private handleRedo(entry: { type: string; data: unknown }): void {
    if (!this.scene) return

    switch (entry.type) {
      case 'add':
        // Re-add the object
        const addData = entry.data as EditorObject
        this.scene.objects.push(addData)
        break

      case 'remove':
        // Remove the object again
        const removeData = entry.data as EditorObject
        const removeIndex = this.scene.objects.findIndex(o => o.id === removeData.id)
        if (removeIndex !== -1) {
          this.scene.objects.splice(removeIndex, 1)
        }
        break

      case 'update':
        // Apply updates again
        const updateData = entry.data as { objectId: string; updates: Partial<EditorObject> }
        const obj = this.scene.objects.find(o => o.id === updateData.objectId)
        if (obj) {
          Object.assign(obj, updateData.updates)
        }
        break
    }

    this.isDirty = true
    this.layers.setObjects(this.scene.objects)
    this.selection.setObjects(this.scene.objects)
    this.transform.setObjects(this.scene.objects)
  }

  /**
   * Handle mouse down
   */
  private handleMouseDown(data: { point: { x: number; y: number }; event: MouseEvent }): void {
    if (!this.scene) return

    const object = this.selection.findObjectAtPoint(data.point)
    
    if (object) {
      if (data.event.shiftKey) {
        this.selection.toggleSelection(object.id)
      } else if (!this.selection.isSelected(object.id)) {
        this.selection.clearSelection()
        this.selection.select(object.id)
      }
    } else {
      this.selection.clearSelection()
    }
  }

  /**
   * Handle mouse move
   */
  private handleMouseMove(data: { point: { x: number; y: number }; event: MouseEvent }): void {
    // Handle dragging if needed
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp(data: { point: { x: number; y: number }; event: MouseEvent }): void {
    // Handle drop if needed
  }

  /**
   * Handle key down
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'c':
          this.copySelected()
          break
        case 'x':
          this.cutSelected()
          break
        case 'v':
          this.paste()
          break
        case 'z':
          if (e.shiftKey) {
            this.redo()
          } else {
            this.undo()
          }
          break
        case 'a':
          this.selection.selectAll()
          break
      }
    } else {
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          const selected = this.selection.getSelectedIds()
          selected.forEach(id => this.removeObject(id))
          break
      }
    }
  }

  /**
   * Handle selection changed
   */
  private handleSelectionChanged(objectIds: string[]): void {
    const objects = objectIds
      .map(id => this.scene?.objects.find(o => o.id === id))
      .filter((o): o is EditorObject => o !== undefined)

    this.inspector.setSelectedObject(objects.length === 1 ? objects[0] : null)
    this.emit('selectionChanged', objectIds)
  }

  /**
   * Save scene as file
   */
  saveToFile(): MaulOverlayFile | null {
    if (!this.scene) return null

    const file: MaulOverlayFile = {
      version: '1.0.0',
      name: this.scene.name,
      width: this.scene.width,
      height: this.scene.height,
      backgroundColor: this.scene.backgroundColor,
      objects: this.scene.objects,
      animations: this.scene.objects
        .filter(o => o.animation)
        .map(o => o.animation!),
      assets: this.extractAssets(),
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'Maulfinity'
      }
    }

    this.isDirty = false
    return file
  }

  /**
   * Load scene from file
   */
  loadFromFile(file: MaulOverlayFile): void {
    const scene: EditorScene = {
      id: this.generateId(),
      name: file.name,
      width: file.width,
      height: file.height,
      backgroundColor: file.backgroundColor,
      backgroundOpacity: 1,
      objects: file.objects,
      settings: {
        showGrid: true,
        gridSize: 20,
        snapToGrid: true,
        showSafeArea: true,
        safeAreaMargin: 50
      }
    }

    this.loadScene(scene)
  }

  /**
   * Extract asset references from scene
   */
  private extractAssets(): string[] {
    if (!this.scene) return []

    const assets: string[] = []
    for (const obj of this.scene.objects) {
      if (obj.type === 'image' || obj.type === 'gif' || obj.type === 'video') {
        const config = obj.config as { src?: string }
        if (config.src) {
          assets.push(config.src)
        }
      }
    }
    return assets
  }

  /**
   * Check if scene has unsaved changes
   */
  isModified(): boolean {
    return this.isDirty
  }

  /**
   * Get editor state
   */
  getState(): {
    scene: EditorScene | null
    selectedObjects: string[]
    canUndo: boolean
    canRedo: boolean
    isDirty: boolean
  } {
    return {
      scene: this.scene,
      selectedObjects: this.selection.getSelectedIds(),
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
      isDirty: this.isDirty
    }
  }

  /**
   * Get canvas
   */
  getCanvas(): EditorCanvas {
    return this.canvas
  }

  /**
   * Destroy editor
   */
  destroy(): void {
    this.canvas.destroy()
    this.history.clear()
    logger.info('Overlay editor destroyed')
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
