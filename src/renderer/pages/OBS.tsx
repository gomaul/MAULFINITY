import { useState, useEffect } from 'react'
import { Card, Button, Input, Switch, Badge } from '../components/ui'
import { Monitor, Wifi, WifiOff, Video, Radio, Settings, RefreshCw } from 'lucide-react'

export default function OBS() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [scenes, setScenes] = useState<Array<{ name: string; isActive: boolean }>>([])
  const [currentScene, setCurrentScene] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [stats, setStats] = useState({ cpu: 0, memory: 0, fps: 0, bitrate: 0 })

  // Form state
  const [host, setHost] = useState('localhost')
  const [port, setPort] = useState('4455')
  const [password, setPassword] = useState('')

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const status = await window.maulfinity.obs.status()
      setIsConnected(status.status === 'connected')
      setScenes(status.state.scenes || [])
      setCurrentScene(status.state.currentScene)
      setIsRecording(status.state.isRecording)
      setIsStreaming(status.state.isStreaming)
      setStats(status.state.stats)
    } catch (error) {
      console.error('Failed to check OBS status:', error)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const success = await window.maulfinity.obs.connect({
        host,
        port: parseInt(port),
        password: password || undefined
      })
      setIsConnected(success)
      if (success) {
        await checkStatus()
      }
    } catch (error) {
      console.error('Failed to connect to OBS:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await window.maulfinity.obs.disconnect()
      setIsConnected(false)
      setScenes([])
      setCurrentScene(null)
    } catch (error) {
      console.error('Failed to disconnect from OBS:', error)
    }
  }

  const handleSwitchScene = async (sceneName: string) => {
    try {
      await window.maulfinity.obs.switchScene(sceneName)
      setCurrentScene(sceneName)
      setScenes(scenes.map(s => ({ ...s, isActive: s.name === sceneName })))
    } catch (error) {
      console.error('Failed to switch scene:', error)
    }
  }

  const handleToggleRecording = async () => {
    try {
      const success = await window.maulfinity.obs.toggleRecording()
      setIsRecording(success)
    } catch (error) {
      console.error('Failed to toggle recording:', error)
    }
  }

  const handleToggleStreaming = async () => {
    try {
      const success = await window.maulfinity.obs.toggleStreaming()
      setIsStreaming(success)
    } catch (error) {
      console.error('Failed to toggle streaming:', error)
    }
  }

  const handleRefresh = async () => {
    await checkStatus()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">OBS Studio</h1>
          <p className="text-text-secondary mt-1">Connect and control OBS Studio</p>
        </div>
        <Button variant="ghost" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Connection Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Connection</h2>
          <Badge variant={isConnected ? 'success' : 'default'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        
        {!isConnected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="localhost"
              />
              <Input
                label="Port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="4455"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect to OBS'}
            </Button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Button variant="danger" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        )}
      </Card>

      {/* Control Panel */}
      {isConnected && (
        <div className="grid grid-cols-2 gap-6">
          {/* Recording */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-error/10 rounded-lg">
                <Video className="w-5 h-5 text-error" />
              </div>
              <h3 className="font-medium text-text-primary">Recording</h3>
            </div>
            <Button
              variant={isRecording ? 'danger' : 'primary'}
              onClick={handleToggleRecording}
              className="w-full"
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
          </Card>

          {/* Streaming */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-success/10 rounded-lg">
                <Radio className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-medium text-text-primary">Streaming</h3>
            </div>
            <Button
              variant={isStreaming ? 'danger' : 'primary'}
              onClick={handleToggleStreaming}
              className="w-full"
            >
              {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
            </Button>
          </Card>
        </div>
      )}

      {/* Scenes */}
      {isConnected && scenes.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Scenes</h2>
          <div className="grid grid-cols-3 gap-3">
            {scenes.map((scene) => (
              <Button
                key={scene.name}
                variant={scene.name === currentScene ? 'primary' : 'secondary'}
                onClick={() => handleSwitchScene(scene.name)}
                className="justify-start"
              >
                <Monitor className="w-4 h-4 mr-2" />
                {scene.name}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Stats */}
      {isConnected && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Statistics</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.cpu}%</p>
              <p className="text-sm text-text-secondary">CPU</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.memory}MB</p>
              <p className="text-sm text-text-secondary">Memory</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.fps}</p>
              <p className="text-sm text-text-secondary">FPS</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{(stats.bitrate / 1000).toFixed(1)}K</p>
              <p className="text-sm text-text-secondary">Bitrate</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
