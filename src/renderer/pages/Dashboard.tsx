import { useState, useEffect } from 'react'
import { Card } from '../components/ui'
import { Activity, Zap, Radio, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    profiles: 0,
    triggers: 0,
    events: 0,
    connected: false
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const profiles = await window.maulfinity.profile.list()
      const status = await window.maulfinity.system.getStatus()
      setStats({
        profiles: profiles.length,
        triggers: 0,
        events: 0,
        connected: status.connected
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Radio className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Connection</p>
              <p className={`text-lg font-semibold ${stats.connected ? 'text-success' : 'text-error'}`}>
                {stats.connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <Activity className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Profiles</p>
              <p className="text-lg font-semibold text-text-primary">{stats.profiles}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 rounded-lg">
              <Zap className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Active Triggers</p>
              <p className="text-lg font-semibold text-text-primary">{stats.triggers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Events Today</p>
              <p className="text-lg font-semibold text-text-primary">{stats.events}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-bg-dark hover:bg-bg-input rounded-lg text-left transition-colors">
            <Zap className="w-5 h-5 text-warning mb-2" />
            <p className="text-sm font-medium text-text-primary">Create Trigger</p>
          </button>
          <button className="p-4 bg-bg-dark hover:bg-bg-input rounded-lg text-left transition-colors">
            <Radio className="w-5 h-5 text-primary mb-2" />
            <p className="text-sm font-medium text-text-primary">Start Live</p>
          </button>
          <button className="p-4 bg-bg-dark hover:bg-bg-input rounded-lg text-left transition-colors">
            <Activity className="w-5 h-5 text-success mb-2" />
            <p className="text-sm font-medium text-text-primary">View Events</p>
          </button>
          <button className="p-4 bg-bg-dark hover:bg-bg-input rounded-lg text-left transition-colors">
            <TrendingUp className="w-5 h-5 text-accent mb-2" />
            <p className="text-sm font-medium text-text-primary">Analytics</p>
          </button>
        </div>
      </Card>
    </div>
  )
}
