import { useState, useEffect } from 'react'
import { Card, Button, Badge, Switch } from '../components/ui'
import { Puzzle, Download, Settings, Trash2 } from 'lucide-react'

export default function Plugins() {
  const [plugins, setPlugins] = useState([])

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    try {
      const data = await window.maulfinity.plugin.list()
      setPlugins(data)
    } catch (error) {
      console.error('Failed to load plugins:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Plugins</h1>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Install Plugin
        </Button>
      </div>

      {/* Plugins List */}
      {plugins.length === 0 ? (
        <Card className="p-12 text-center">
          <Puzzle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No plugins installed</h3>
          <p className="text-text-secondary mb-4">Install plugins to extend Maulfinity's functionality.</p>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Browse Plugins
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {plugins.map((plugin: any) => (
            <Card key={plugin.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Puzzle className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">{plugin.name}</h3>
                    <p className="text-sm text-text-secondary">v{plugin.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={plugin.enabled} onChange={() => {}} />
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
