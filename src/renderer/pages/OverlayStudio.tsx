import { Card, Button } from '../components/ui'
import { Plus, Layers } from 'lucide-react'

export default function OverlayStudio() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Overlay Studio</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Overlay
        </Button>
      </div>

      {/* Editor Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <Card className="lg:col-span-2 p-6">
          <div className="aspect-video bg-bg-dark rounded-lg flex items-center justify-center border border-border">
            <div className="text-center">
              <Layers className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary">Select or create an overlay to start editing</p>
            </div>
          </div>
        </Card>

        {/* Layers Panel */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Layers</h3>
          <div className="space-y-2">
            <p className="text-text-secondary text-sm">No layers yet</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
