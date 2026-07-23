import { Card, Input, Button } from '../components/ui'
import { Save, RefreshCw } from 'lucide-react'

export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>

      {/* General Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">General</h2>
        <div className="space-y-4">
          <Input label="App Name" value="Maulfinity" disabled />
          <Input label="Version" value="0.1.0" disabled />
        </div>
      </Card>

      {/* OBS Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">OBS Integration</h2>
        <div className="space-y-4">
          <Input label="WebSocket Host" placeholder="localhost" defaultValue="localhost" />
          <Input label="WebSocket Port" placeholder="4455" defaultValue="4455" />
          <Input label="Password" type="password" placeholder="Enter OBS WebSocket password" />
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save OBS Settings
          </Button>
        </div>
      </Card>

      {/* TTS Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Text-to-Speech</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Enable TTS</p>
              <p className="text-sm text-text-secondary">Automatically read comments and gifts aloud</p>
            </div>
            <Button variant="secondary">Configure</Button>
          </div>
        </div>
      </Card>

      {/* Advanced */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Advanced</h2>
        <div className="space-y-4">
          <Button variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Check for Updates
          </Button>
          <Button variant="danger">
            Reset All Settings
          </Button>
        </div>
      </Card>
    </div>
  )
}
