import { useState, useEffect, useRef } from 'react'
import { Card, Button, Input } from '../components/ui'
import { 
  Plus, Layers, Image, Type, Square, Circle, 
  Copy, Trash2, Eye, EyeOff, Lock, Unlock,
  Undo2, Redo2, Save, Download, Upload,
  Grid, Ruler, ZoomIn, ZoomOut, Maximize,
  Play, Pause
} from 'lucide-react'

interface EditorObject {
  id: string
  type: string
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  zIndex: number
}

interface LayerInfo {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
}

export default function OverlayStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [sceneName, setSceneName] = useState('Untitled Overlay')
  const [objects, setObjects] = useState<EditorObject[]>([])
  const [layers, setLayers] = useState<LayerInfo[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [showGrid, setShowGrid] = useState(true)
  const [showSafeArea, setShowSafeArea] = useState(true)

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        // Set canvas size
        canvasRef.current.width = 1920
        canvasRef.current.height = 1080
        // Draw initial state
        drawScene(ctx)
      }
    }
  }, [objects, selectedId])

  const drawScene = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 1920, 1080)

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      for (let x = 0; x <= 1920; x += 20) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, 1080)
        ctx.stroke()
      }
      for (let y = 0; y <= 1080; y += 20) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(1920, y)
        ctx.stroke()
      }
    }

    // Draw safe area if enabled
    if (showSafeArea) {
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(50, 50, 1820, 980)
      ctx.setLineDash([])
    }

    // Draw objects
    objects.forEach(obj => {
      if (!obj.visible) return

      ctx.save()
      ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2)
      ctx.rotate((obj.rotation * Math.PI) / 180)
      ctx.globalAlpha = obj.opacity

      switch (obj.type) {
        case 'rectangle':
          ctx.fillStyle = '#3b82f6'
          ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height)
          break
        case 'circle':
          ctx.fillStyle = '#8b5cf6'
          ctx.beginPath()
          ctx.arc(0, 0, Math.min(obj.width, obj.height) / 2, 0, Math.PI * 2)
          ctx.fill()
          break
        case 'text':
          ctx.fillStyle = '#ffffff'
          ctx.font = '24px Inter'
          ctx.textBaseline = 'middle'
          ctx.fillText(obj.name, -obj.width / 2, 0)
          break
        default:
          ctx.fillStyle = '#374151'
          ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height)
      }

      // Draw selection
      if (obj.id === selectedId) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.strokeRect(-obj.width / 2 - 2, -obj.height / 2 - 2, obj.width + 4, obj.height + 4)
        ctx.setLineDash([])
      }

      ctx.restore()
    })
  }

  const addObject = (type: string) => {
    const newObj: EditorObject = {
      id: `obj_${Date.now()}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${objects.length + 1}`,
      x: 100 + objects.length * 20,
      y: 100 + objects.length * 20,
      width: 200,
      height: 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: objects.length
    }
    setObjects([...objects, newObj])
    setLayers([...layers, { id: newObj.id, name: newObj.name, visible: true, locked: false, opacity: 1 }])
  }

  const deleteObject = (id: string) => {
    setObjects(objects.filter(o => o.id !== id))
    setLayers(layers.filter(l => l.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const toggleVisibility = (id: string) => {
    setObjects(objects.map(o => o.id === id ? { ...o, visible: !o.visible } : o))
    setLayers(layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l))
  }

  const toggleLock = (id: string) => {
    setObjects(objects.map(o => o.id === id ? { ...o, locked: !o.locked } : o))
    setLayers(layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Toolbar */}
      <div className="h-12 bg-bg-card border-b border-border flex items-center px-4 gap-4">
        <input
          type="text"
          value={sceneName}
          onChange={(e) => setSceneName(e.target.value)}
          className="bg-transparent text-text-primary font-medium px-2 py-1 rounded hover:bg-bg-dark focus:outline-none focus:ring-2 focus:ring-primary"
        />
        
        <div className="flex-1" />

        {/* Tool buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => addObject('rectangle')}>
            <Square className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => addObject('circle')}>
            <Circle className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => addObject('text')}>
            <Type className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => addObject('image')}>
            <Image className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* View controls */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowGrid(!showGrid)}>
            <Grid className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowSafeArea(!showSafeArea)}>
            <Ruler className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(25, zoom - 25))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-text-secondary">{zoom}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(400, zoom + 25))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setZoom(100)}>
            <Maximize className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* History */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled={!canUndo} onClick={() => {}}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" disabled={!canRedo} onClick={() => {}}>
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Save className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Upload className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Asset Library */}
        <div className="w-64 bg-bg-card border-r border-border p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Asset Library</h3>
          <div className="space-y-2">
            <div className="p-3 bg-bg-dark rounded-lg border border-border hover:border-primary cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-primary" />
                <span className="text-sm text-text-primary">Images</span>
              </div>
            </div>
            <div className="p-3 bg-bg-dark rounded-lg border border-border hover:border-primary cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" />
                <span className="text-sm text-text-primary">Fonts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 bg-bg-dark flex items-center justify-center overflow-auto p-4">
          <div 
            className="bg-black shadow-2xl"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center'
            }}
          >
            <canvas
              ref={canvasRef}
              className="border border-border cursor-crosshair"
              style={{ width: '960px', height: '540px' }}
            />
          </div>
        </div>

        {/* Right: Layers + Inspector */}
        <div className="w-72 bg-bg-card border-l border-border flex flex-col">
          {/* Layers Panel */}
          <div className="flex-1 p-4 overflow-y-auto border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary">Layers</h3>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {layers.length === 0 ? (
                <p className="text-text-secondary text-sm">No layers</p>
              ) : (
                layers.map(layer => (
                  <div
                    key={layer.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                      selectedId === layer.id ? 'bg-primary/10' : 'hover:bg-bg-dark'
                    }`}
                    onClick={() => setSelectedId(layer.id)}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id) }}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLock(layer.id) }}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <span className="text-sm text-text-primary flex-1 truncate">{layer.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteObject(layer.id) }}
                      className="text-text-secondary hover:text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inspector Panel */}
          <div className="h-64 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Inspector</h3>
            {selectedId ? (
              <div className="space-y-3">
                {objects.filter(o => o.id === selectedId).map(obj => (
                  <div key={obj.id} className="space-y-2">
                    <Input
                      label="Name"
                      value={obj.name}
                      onChange={(e) => {
                        setObjects(objects.map(o => 
                          o.id === obj.id ? { ...o, name: e.target.value } : o
                        ))
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="X"
                        type="number"
                        value={obj.x}
                        onChange={(e) => {
                          setObjects(objects.map(o => 
                            o.id === obj.id ? { ...o, x: Number(e.target.value) } : o
                          ))
                        }}
                      />
                      <Input
                        label="Y"
                        type="number"
                        value={obj.y}
                        onChange={(e) => {
                          setObjects(objects.map(o => 
                            o.id === obj.id ? { ...o, y: Number(e.target.value) } : o
                          ))
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Width"
                        type="number"
                        value={obj.width}
                        onChange={(e) => {
                          setObjects(objects.map(o => 
                            o.id === obj.id ? { ...o, width: Number(e.target.value) } : o
                          ))
                        }}
                      />
                      <Input
                        label="Height"
                        type="number"
                        value={obj.height}
                        onChange={(e) => {
                          setObjects(objects.map(o => 
                            o.id === obj.id ? { ...o, height: Number(e.target.value) } : o
                          ))
                        }}
                      />
                    </div>
                    <Input
                      label="Rotation"
                      type="number"
                      value={obj.rotation}
                      onChange={(e) => {
                        setObjects(objects.map(o => 
                          o.id === obj.id ? { ...o, rotation: Number(e.target.value) } : o
                        ))
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-sm">Select an object to inspect</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="h-32 bg-bg-card border-t border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-text-primary">Timeline</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Play className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Pause className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 bg-bg-dark rounded-lg p-2">
          <p className="text-text-secondary text-sm text-center">Timeline editor coming soon</p>
        </div>
      </div>
    </div>
  )
}
