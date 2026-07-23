import { useState, useEffect, useRef } from 'react'
import { Card, Button, Input, Badge } from '../components/ui'
import { Wifi, WifiOff, RefreshCw, Activity, User, MessageSquare, Heart, Gift } from 'lucide-react'

interface ConnectorStatus {
  platform: string
  connected: boolean
  state: string
  username?: string
}

interface EventLogEntry {
  id: string
  type: string
  platform: string
  user: string
  payload: Record<string, unknown>
  timestamp: number
}

const EVENT_ICONS: Record<string, typeof Gift> = {
  gift: Gift,
  comment: MessageSquare,
  follow: Heart,
  like: Heart,
  share: Activity,
  join: User,
  superchat: Gift,
  membership: Heart
}

export default function Live() {
  const [tiktokStatus, setTiktokStatus] = useState<ConnectorStatus>({ platform: 'tiktok', connected: false, state: 'disconnected' })
  const [youtubeStatus, setYoutubeStatus] = useState<ConnectorStatus>({ platform: 'youtube', connected: false, state: 'disconnected' })
  const [activePlatform, setActivePlatform] = useState<'tiktok' | 'youtube'>('tiktok')
  const [username, setUsername] = useState('')
  const [events, setEvents] = useState<EventLogEntry[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const eventLogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAllStatus()
    fetchEvents()
    const interval = setInterval(() => {
      checkAllStatus()
      fetchEvents()
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const checkAllStatus = async () => {
    try {
      const allStatus = await window.maulfinity.connector.allStatus()
      for (const s of allStatus) {
        if (s.platform === 'tiktok') setTiktokStatus(s)
        if (s.platform === 'youtube') setYoutubeStatus(s)
      }
    } catch {
      // ignore
    }
  }

  const fetchEvents = async () => {
    try {
      const history = await window.maulfinity.connector.getEventHistory(50)
      setEvents(history)
    } catch {
      // ignore
    }
  }

  const currentStatus = activePlatform === 'tiktok' ? tiktokStatus : youtubeStatus

  const handleConnect = async () => {
    if (!username) return
    setIsConnecting(true)
    try {
      await window.maulfinity.connector.connect(activePlatform, username)
      await checkAllStatus()
    } catch {
      console.error('Connect failed')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await window.maulfinity.connector.disconnect(activePlatform)
      await checkAllStatus()
    } catch {
      console.error('Disconnect failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Live Center</h1>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Activity className="w-4 h-4" />
          {events.length} events received
        </div>
      </div>

      {/* Platform Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setActivePlatform('tiktok')}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
            activePlatform === 'tiktok'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-bg-panel text-text-secondary hover:bg-border border border-border'
          }`}
        >
          TikTok {tiktokStatus.connected && '🟢'}
        </button>
        <button
          onClick={() => setActivePlatform('youtube')}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
            activePlatform === 'youtube'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-bg-panel text-text-secondary hover:bg-border border border-border'
          }`}
        >
          YouTube {youtubeStatus.connected && '🟢'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary capitalize">{activePlatform} Connection</h2>
            <Badge variant={currentStatus.connected ? 'success' : currentStatus.state === 'connecting' ? 'warning' : 'error'}>
              {currentStatus.connected ? '🟢 Connected' : currentStatus.state === 'connecting' ? '🟡 Connecting...' : '🔴 Disconnected'}
            </Badge>
          </div>

          <div className="space-y-4">
            {currentStatus.connected && currentStatus.username && (
              <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
                <User className="w-5 h-5 text-success" />
                <div>
                  <div className="text-sm text-text-secondary">Username</div>
                  <div className="font-medium text-text-primary">{currentStatus.username}</div>
                </div>
              </div>
            )}

            <Input
              label="Username"
              placeholder={`Enter ${activePlatform} username...`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={currentStatus.connected}
            />

            <div className="flex gap-3">
              {currentStatus.connected ? (
                <Button variant="danger" onClick={handleDisconnect} className="flex-1">
                  <WifiOff className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              ) : (
                <Button onClick={handleConnect} disabled={!username || isConnecting} className="flex-1">
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wifi className="w-4 h-4 mr-2" />
                  )}
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Event Log */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Event Log</h2>
            <Button variant="ghost" size="sm" onClick={() => setEvents([])}>
              Clear
            </Button>
          </div>

          <div ref={eventLogRef} className="h-80 overflow-y-auto space-y-2 scrollbar-thin">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-secondary">
                <Activity className="w-12 h-12 mb-3 opacity-30" />
                <p>No events yet</p>
                <p className="text-sm">Connect to a platform to start receiving events</p>
              </div>
            ) : (
              events.map((event) => {
                const Icon = EVENT_ICONS[event.type] || Activity
                return (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-bg-panel rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="info">{event.type}</Badge>
                        <span className="text-xs text-text-secondary">{event.platform}</span>
                      </div>
                      <div className="text-sm text-text-primary mt-1">
                        <strong>{event.user}</strong>
                        {event.type === 'gift' && ` sent ${event.payload.name} x${event.payload.count}`}
                        {event.type === 'comment' && `: "${event.payload.text}"`}
                        {event.type === 'superchat' && ` sent $${event.payload.amount} ${event.payload.currency}`}
                      </div>
                      <div className="text-xs text-text-secondary mt-1">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
