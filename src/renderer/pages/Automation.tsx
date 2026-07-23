import { useState, useEffect } from 'react'
import { Card, Button, Badge, Modal, Input, Switch } from '../components/ui'
import { Plus, Zap, Play, Pause, Trash2, Settings, Activity } from 'lucide-react'

interface Automation {
  id: string
  profileId: string
  name: string
  description?: string
  type: string
  enabled: boolean
  eventType: string
  conditions: Array<{ type: string; operator?: string; value: unknown }>
  actions: Array<{ type: string; config: Record<string, unknown> }>
  cooldown?: number
  createdAt: string
  updatedAt: string
}

interface AutomationStats {
  total: number
  enabled: number
  byProfile: Record<string, number>
}

export default function Automation() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; status: string; error?: string } | null>(null)
  const [stats, setStats] = useState<AutomationStats | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventType: 'gift',
    conditions: [] as Array<{ type: string; operator?: string; value: unknown }>,
    actions: [] as Array<{ type: string; config: Record<string, unknown> }>
  })

  useEffect(() => {
    loadAutomations()
    loadStats()
  }, [])

  const loadAutomations = async () => {
    try {
      // TODO: Get current profile's automations
      const data = await window.maulfinity.automation.list('current')
      setAutomations(data)
    } catch (error) {
      console.error('Failed to load automations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await window.maulfinity.automation.getStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleCreate = async () => {
    try {
      await window.maulfinity.automation.create({
        profileId: 'current',
        name: formData.name,
        description: formData.description,
        type: 'simple',
        enabled: true,
        eventType: formData.eventType,
        conditions: formData.conditions,
        actions: formData.actions
      })
      setShowCreateModal(false)
      setFormData({ name: '', description: '', eventType: 'gift', conditions: [], actions: [] })
      loadAutomations()
      loadStats()
    } catch (error) {
      console.error('Failed to create automation:', error)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await window.maulfinity.automation.toggle(id)
      loadAutomations()
      loadStats()
    } catch (error) {
      console.error('Failed to toggle automation:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return
    try {
      await window.maulfinity.automation.delete(id)
      loadAutomations()
      loadStats()
    } catch (error) {
      console.error('Failed to delete automation:', error)
    }
  }

  const handleTest = async (id: string) => {
    setShowTestModal(id)
    setTestResult(null)
    try {
      const result = await window.maulfinity.automation.test(id)
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, status: 'failed', error: (error as Error).message })
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'gift': return '🎁'
      case 'comment': return '💬'
      case 'follow': return '👤'
      case 'like': return '❤️'
      case 'join': return '👋'
      case 'superchat': return '💰'
      case 'membership': return '⭐'
      default: return '⚡'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Automation</h1>
          <p className="text-text-secondary mt-1">Create and manage event-driven automations</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Automation
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total</p>
                <p className="text-xl font-bold text-text-primary">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Zap className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Active</p>
                <p className="text-xl font-bold text-text-primary">{stats.enabled}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Pause className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Inactive</p>
                <p className="text-xl font-bold text-text-primary">{stats.total - stats.enabled}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Automations List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-6">
            <p className="text-text-secondary">Loading automations...</p>
          </Card>
        ) : automations.length === 0 ? (
          <Card className="p-12 text-center">
            <Zap className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No automations yet</h3>
            <p className="text-text-secondary mb-4">Create your first automation to streamline your livestream.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Automation
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {automations.map((automation) => (
              <Card key={automation.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getEventIcon(automation.eventType)}</div>
                    <div>
                      <h3 className="font-medium text-text-primary">{automation.name}</h3>
                      <p className="text-sm text-text-secondary">
                        When {automation.eventType} → {automation.actions.length} action{automation.actions.length !== 1 ? 's' : ''}
                      </p>
                      {automation.description && (
                        <p className="text-xs text-text-secondary mt-1">{automation.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={automation.enabled}
                      onChange={() => handleToggle(automation.id)}
                    />
                    <Badge variant={automation.enabled ? 'success' : 'default'}>
                      {automation.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTest(automation.id)}
                      title="Test automation"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(automation.id)}
                      title="Delete automation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Automation"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Rose Attack"
          />
          <Input
            label="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What does this automation do?"
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-secondary">Event Type</label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              className="w-full px-3 py-2 bg-bg-input border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="gift">Gift</option>
              <option value="comment">Comment</option>
              <option value="follow">Follow</option>
              <option value="like">Like</option>
              <option value="join">Join</option>
              <option value="superchat">Super Chat</option>
              <option value="membership">Membership</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Test Modal */}
      <Modal
        isOpen={!!showTestModal}
        onClose={() => setShowTestModal(null)}
        title="Test Result"
      >
        {testResult ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-success/10' : 'bg-error/10'}`}>
              <p className={`font-medium ${testResult.success ? 'text-success' : 'text-error'}`}>
                {testResult.success ? '✅ Test Passed' : '❌ Test Failed'}
              </p>
              <p className="text-sm text-text-secondary mt-1">Status: {testResult.status}</p>
              {testResult.error && (
                <p className="text-sm text-error mt-1">{testResult.error}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowTestModal(null)}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-text-secondary">Running test...</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
