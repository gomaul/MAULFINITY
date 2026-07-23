import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import { 
  Point, Rect, Transform, EditorObject, EditorScene, 
  EditorViewport, EditorMode 
} from '../types'

const logger = new Logger('EditorCanvas')

/**
 * EditorCanvas - Main canvas for overlay editing
 * 
 * Responsibilities:
 * - Infinite canvas with zoom/pan
 * - Object rendering
 * - Selection rendering
 * - Grid rendering
 * - Safe area rendering
 * - Ruler rendering
 */
export class EditorCanvas extends EventEmitter {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private viewport: EditorViewport = { x: 0, y: 0, zoom: 1 }
  private mode: EditorMode = 'select'
  private scene: EditorScene | null = null
  private selectedObjects: string[] = []
  private isRendering = false
  private animationFrameId: number | null = null

  // Canvas settings
  private gridVisible = true
  private gridSize = 20
  private safeAreaVisible = true
  private safeAreaMargin = 50

  constructor() {
    super()
  }

  /**
   * Initialize canvas with HTML element
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    
    if (!this.ctx) {
      logger.error('Failed to get canvas context')
      return
    }

    this.setupEventListeners()
    this.startRenderLoop()
    logger.info('Editor canvas initialized')
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.canvas) return

    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this))

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))

    // Resize observer
    const resizeObserver = new ResizeObserver(() => this.handleResize())
    resizeObserver.observe(this.canvas)
  }

  /**
   * Handle mouse down
   */
  private handleMouseDown(e: MouseEvent): void {
    const point = this.screenToCanvas({ x: e.offsetX, y: e.offsetY })
    this.emit('mouseDown', { point, event: e })
  }

  /**
   * Handle mouse move
   */
  private handleMouseMove(e: MouseEvent): void {
    const point = this.screenToCanvas({ x: e.offsetX, y: e.offsetY })
    this.emit('mouseMove', { point, event: e })
  }

  /**
   * Handle mouse up
   */
  private handleMouseUp(e: MouseEvent): void {
    const point = this.screenToCanvas({ x: e.offsetX, y: e.offsetY })
    this.emit('mouseUp', { point, event: e })
  }

  /**
   * Handle mouse wheel (zoom)
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(10, this.viewport.zoom * delta))
    
    // Zoom towards mouse position
    const mouseX = e.offsetX
    const mouseY = e.offsetY
    
    const zoomRatio = newZoom / this.viewport.zoom
    this.viewport.x = mouseX - (mouseX - this.viewport.x) * zoomRatio
    this.viewport.y = mouseY - (mouseY - this.viewport.y) * zoomRatio
    this.viewport.zoom = newZoom
    
    this.emit('viewportChanged', this.viewport)
  }

  /**
   * Handle key down
   */
  private handleKeyDown(e: KeyboardEvent): void {
    this.emit('keyDown', e)
  }

  /**
   * Handle key up
   */
  private handleKeyUp(e: KeyboardEvent): void {
    this.emit('keyUp', e)
  }

  /**
   * Handle resize
   */
  private handleResize(): void {
    if (!this.canvas) return
    
    this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio
    this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio
    
    if (this.ctx) {
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    
    this.emit('resize', { width: this.canvas.clientWidth, height: this.canvas.clientHeight })
  }

  /**
   * Convert screen coordinates to canvas coordinates
   */
  screenToCanvas(screen: Point): Point {
    return {
      x: (screen.x - this.viewport.x) / this.viewport.zoom,
      y: (screen.y - this.viewport.y) / this.viewport.zoom
    }
  }

  /**
   * Convert canvas coordinates to screen coordinates
   */
  canvasToScreen(canvas: Point): Point {
    return {
      x: canvas.x * this.viewport.zoom + this.viewport.x,
      y: canvas.y * this.viewport.zoom + this.viewport.y
    }
  }

  /**
   * Start render loop
   */
  private startRenderLoop(): void {
    this.isRendering = true
    this.render()
  }

  /**
   * Stop render loop
   */
  stopRenderLoop(): void {
    this.isRendering = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Render loop
   */
  private render(): void {
    if (!this.isRendering || !this.ctx || !this.canvas) return

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Save context
    this.ctx.save()

    // Apply viewport transform
    this.ctx.translate(this.viewport.x, this.viewport.y)
    this.ctx.scale(this.viewport.zoom, this.viewport.zoom)

    // Draw scene background
    this.drawSceneBackground()

    // Draw grid
    if (this.gridVisible) {
      this.drawGrid()
    }

    // Draw safe area
    if (this.safeAreaVisible) {
      this.drawSafeArea()
    }

    // Draw objects
    if (this.scene) {
      this.drawObjects(this.scene.objects)
    }

    // Draw selection
    this.drawSelection()

    // Restore context
    this.ctx.restore()

    // Request next frame
    this.animationFrameId = requestAnimationFrame(() => this.render())
  }

  /**
   * Draw scene background
   */
  private drawSceneBackground(): void {
    if (!this.ctx || !this.scene) return

    this.ctx.fillStyle = this.scene.backgroundColor || '#000000'
    this.ctx.globalAlpha = this.scene.backgroundOpacity ?? 1
    this.ctx.fillRect(0, 0, this.scene.width, this.scene.height)
    this.ctx.globalAlpha = 1
  }

  /**
   * Draw grid
   */
  private drawGrid(): void {
    if (!this.ctx || !this.scene) return

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    this.ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x <= this.scene.width; x += this.gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.scene.height)
      this.ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y <= this.scene.height; y += this.gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.scene.width, y)
      this.ctx.stroke()
    }
  }

  /**
   * Draw safe area
   */
  private drawSafeArea(): void {
    if (!this.ctx || !this.scene) return

    const margin = this.safeAreaMargin
    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([5, 5])

    this.ctx.strokeRect(
      margin, 
      margin, 
      this.scene.width - margin * 2, 
      this.scene.height - margin * 2
    )

    this.ctx.setLineDash([])
  }

  /**
   * Draw objects
   */
  private drawObjects(objects: EditorObject[]): void {
    if (!this.ctx) return

    // Sort by zIndex
    const sorted = [...objects].sort((a, b) => a.zIndex - b.zIndex)

    for (const obj of sorted) {
      if (!obj.visible) continue
      this.drawObject(obj)
    }
  }

  /**
   * Draw single object
   */
  private drawObject(obj: EditorObject): void {
    if (!this.ctx) return

    this.ctx.save()

    // Apply transform
    this.ctx.translate(
      obj.transform.position.x + obj.transform.size.width / 2,
      obj.transform.position.y + obj.transform.size.height / 2
    )
    this.ctx.rotate((obj.transform.rotation * Math.PI) / 180)
    this.ctx.translate(
      -obj.transform.size.width / 2,
      -obj.transform.size.height / 2
    )

    // Apply opacity
    this.ctx.globalAlpha = obj.opacity

    // Draw based on type
    switch (obj.type) {
      case 'rectangle':
        this.drawRectangle(obj)
        break
      case 'circle':
        this.drawCircle(obj)
        break
      case 'text':
        this.drawText(obj)
        break
      case 'image':
        this.drawImage(obj)
        break
      default:
        this.drawPlaceholder(obj)
    }

    this.ctx.globalAlpha = 1
    this.ctx.restore()
  }

  /**
   * Draw rectangle
   */
  private drawRectangle(obj: EditorObject): void {
    if (!this.ctx) return

    const config = obj.config as { fillColor?: string; strokeColor?: string; strokeWidth?: number }
    this.ctx.fillStyle = config.fillColor || '#3b82f6'
    this.ctx.fillRect(0, 0, obj.transform.size.width, obj.transform.size.height)

    if (config.strokeColor) {
      this.ctx.strokeStyle = config.strokeColor
      this.ctx.lineWidth = config.strokeWidth || 2
      this.ctx.strokeRect(0, 0, obj.transform.size.width, obj.transform.size.height)
    }
  }

  /**
   * Draw circle
   */
  private drawCircle(obj: EditorObject): void {
    if (!this.ctx) return

    const config = obj.config as { fillColor?: string; strokeColor?: string }
    const centerX = obj.transform.size.width / 2
    const centerY = obj.transform.size.height / 2
    const radius = Math.min(centerX, centerY)

    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    this.ctx.fillStyle = config.fillColor || '#8b5cf6'
    this.ctx.fill()

    if (config.strokeColor) {
      this.ctx.strokeStyle = config.strokeColor
      this.ctx.lineWidth = 2
      this.ctx.stroke()
    }
  }

  /**
   * Draw text
   */
  private drawText(obj: EditorObject): void {
    if (!this.ctx) return

    const config = obj.config as { text?: string; fontSize?: number; fontFamily?: string; color?: string }
    this.ctx.font = `${config.fontSize || 24}px ${config.fontFamily || 'Inter'}`
    this.ctx.fillStyle = config.color || '#ffffff'
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(config.text || 'Text', 0, 0)
  }

  /**
   * Draw image
   */
  private drawImage(obj: EditorObject): void {
    if (!this.ctx) return

    const config = obj.config as { src?: string }
    if (config.src) {
      const img = new Image()
      img.src = config.src
      img.onload = () => {
        this.ctx?.drawImage(img, 0, 0, obj.transform.size.width, obj.transform.size.height)
      }
    } else {
      this.drawPlaceholder(obj)
    }
  }

  /**
   * Draw placeholder
   */
  private drawPlaceholder(obj: EditorObject): void {
    if (!this.ctx) return

    this.ctx.fillStyle = '#374151'
    this.ctx.fillRect(0, 0, obj.transform.size.width, obj.transform.size.height)
    this.ctx.strokeStyle = '#6b7280'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(0, 0, obj.transform.size.width, obj.transform.size.height)

    // Draw type label
    this.ctx.fillStyle = '#9ca3af'
    this.ctx.font = '14px Inter'
    this.ctx.textBaseline = 'middle'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(
      obj.type.toUpperCase(),
      obj.transform.size.width / 2,
      obj.transform.size.height / 2
    )
    this.ctx.textAlign = 'start'
  }

  /**
   * Draw selection
   */
  private drawSelection(): void {
    if (!this.ctx || this.selectedObjects.length === 0) return

    // Draw selection box for each selected object
    for (const objId of this.selectedObjects) {
      const obj = this.scene?.objects.find(o => o.id === objId)
      if (!obj) continue

      this.ctx.strokeStyle = '#3b82f6'
      this.ctx.lineWidth = 2
      this.ctx.setLineDash([5, 5])
      this.ctx.strokeRect(
        obj.transform.position.x - 2,
        obj.transform.position.y - 2,
        obj.transform.size.width + 4,
        obj.transform.size.height + 4
      )
      this.ctx.setLineDash([])

      // Draw resize handles
      this.drawResizeHandles(obj)
    }
  }

  /**
   * Draw resize handles
   */
  private drawResizeHandles(obj: EditorObject): void {
    if (!this.ctx) return

    const handles = [
      { x: obj.transform.position.x, y: obj.transform.position.y },
      { x: obj.transform.position.x + obj.transform.size.width, y: obj.transform.position.y },
      { x: obj.transform.position.x, y: obj.transform.position.y + obj.transform.size.height },
      { x: obj.transform.position.x + obj.transform.size.width, y: obj.transform.position.y + obj.transform.size.height }
    ]

    this.ctx.fillStyle = '#3b82f6'
    for (const handle of handles) {
      this.ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8)
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  /**
   * Set viewport
   */
  setViewport(viewport: Partial<EditorViewport>): void {
    this.viewport = { ...this.viewport, ...viewport }
    this.emit('viewportChanged', this.viewport)
  }

  /**
   * Get viewport
   */
  getViewport(): EditorViewport {
    return { ...this.viewport }
  }

  /**
   * Set mode
   */
  setMode(mode: EditorMode): void {
    this.mode = mode
    this.emit('modeChanged', mode)
  }

  /**
   * Set scene
   */
  setScene(scene: EditorScene): void {
    this.scene = scene
    this.emit('sceneChanged', scene)
  }

  /**
   * Set selected objects
   */
  setSelectedObjects(objectIds: string[]): void {
    this.selectedObjects = objectIds
    this.emit('selectionChanged', objectIds)
  }

  /**
   * Zoom to fit
   */
  zoomToFit(): void {
    if (!this.canvas || !this.scene) return

    const canvasWidth = this.canvas.clientWidth
    const canvasHeight = this.canvas.clientHeight
    const sceneWidth = this.scene.width
    const sceneHeight = this.scene.height

    const zoom = Math.min(
      canvasWidth / sceneWidth,
      canvasHeight / sceneHeight
    ) * 0.9

    this.viewport = {
      x: (canvasWidth - sceneWidth * zoom) / 2,
      y: (canvasHeight - sceneHeight * zoom) / 2,
      zoom
    }

    this.emit('viewportChanged', this.viewport)
  }

  /**
   * Set grid visible
   */
  setGridVisible(visible: boolean): void {
    this.gridVisible = visible
  }

  /**
   * Set safe area visible
   */
  setSafeAreaVisible(visible: boolean): void {
    this.safeAreaVisible = visible
  }

  /**
   * Destroy canvas
   */
  destroy(): void {
    this.stopRenderLoop()
    this.canvas = null
    this.ctx = null
    logger.info('Editor canvas destroyed')
  }
}
