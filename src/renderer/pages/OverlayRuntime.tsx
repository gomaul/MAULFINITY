import { useState, useEffect } from 'react'
import { Card, Button, Badge, Switch } from '../components/ui'
import { Layers, RefreshCw, Eye, EyeOff, Play, Pause } from 'lucide-react'

interface OverlayObject {
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
  zIndex: number
  config: Record<string, unknown>
  animation?: { type: string; duration: number; easing?: string }
}

interface OverlayScene {
  id: string
  name: string
  objects: OverlayObject[]
  settings: { width: number; height: number; backgroundColor?: string }
}

export default function OverlayRuntimePage() {
  const [currentScene, setCurrentScene] = useState<OverlayScene | null>(null)
  const [objects, setObjects] = useState<OverlayObject[]>([])
  const [isRendering, setIsRendering] = useState(false)

  useEffect(() => {
    loadScene()
  }, [])

  const loadScene = async () => {
    try {
      const scene = await window.maulfinity.overlayRuntime.getCurrentScene()
      setCurrentScene(scene)
      if (scene) {
        setObjects(scene.objects)
      }
    } catch (error) {
      console.error('Failed to load scene:', error)
    }
  }

  const handleToggleRendering = async () => {
    try {
      if (isRendering) {
        await window.maulfinity.overlayRuntime.stopRendering()
      } else {
        await window.maulfinity.overlayRuntime.startRendering()
      }
      setIsRendering(!isRendering)
    } catch (error) {
      console.error('Failed to toggle rendering:', error)
    }
  }

  const handleToggleVisibility = async (objectId: string) => {
    try {
      const obj = objects.find(o => o.id === objectId)
      if (obj) {
        await window.maulfinity.overlayRuntime.setObjectVisibility(objectId, !obj.visible)
        setObjects(objects.map(o => 
          o.id === objectId ? { ...o, visible: !o.visible } : o
        ))
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error)
    }
  }

  const handleReload = async () => {
    if (currentScene) {
      await window.maulfinity.overlayRuntime.reloadScene(currentScene.id)
      await loadScene()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Overlay Runtime</h1>
          <p className="text-text-secondary mt-1">Manage overlay scenes and objects</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleReload}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload
          </Button>
          <Button
            variant={isRendering ? 'danger' : 'primary'}
            onClick={handleToggleRendering}
          >
            {isRendering ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Rendering
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Rendering
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-primary" />
            <span className="font-medium text-text-primary">
              {currentScene ? currentScene.name : 'No Scene Loaded'}
            </span>
          </div>
          <Badge variant={isRendering ? 'success' : 'default'}>
            {isRendering ? 'Rendering' : 'Paused'}
          </Badge>
        </div>
      </Card>

      {/* Objects List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Objects</h2>
        
        {objects.length === 0 ? (
          <p className="text-text-secondary">No objects in current scene</p>
        ) : (
          <div className="space-y-3">
            {objects.map((obj) => (
              <div
                key={obj.id}
                className="flex items-center justify-between p-3 bg-bg-dark rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium text-text-primary">{obj.name}</p>
                    <p className="text-sm text-text-secondary">{obj.type} • z:{obj.zIndex}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleVisibility(obj.id)}
                  >
                    {obj.visible ? (
                      <Eye className="w-4 h-4 text-success" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-text-secondary" />
                    )}
                  </Button>
                  <Switch
                    checked={obj.visible}
                    onChange={() => handleToggleVisibility(obj.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Preview */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Preview</h2>
        <div 
          className="w-full h-64 bg-bg-dark rounded-lg border border-border flex items-center justify-center"
          style={{
            backgroundColor: currentScene?.settings.backgroundColor || '#000000'
          }}
        >
          <p className="text-text-secondary">
            {isRendering ? 'Rendering overlay...' : 'Start rendering to preview'}
          </p>
        </div>
      </Card>
    </div>
  )
}
