import { useState, useEffect } from 'react'
import { Card, Button, Badge } from '../components/ui'
import { Plus, Zap, Edit, Trash2 } from 'lucide-react'

export default function Triggers() {
  const [triggers, setTriggers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTriggers()
  }, [])

  const loadTriggers = async () => {
    try {
      // TODO: Get current profile's triggers
      const data = await window.maulfinity.trigger.list('current')
      setTriggers(data)
    } catch (error) {
      console.error('Failed to load triggers:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Triggers</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Trigger
        </Button>
      </div>

      {/* Triggers List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-6">
            <p className="text-text-secondary">Loading triggers...</p>
          </Card>
        ) : triggers.length === 0 ? (
          <Card className="p-12 text-center">
            <Zap className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No triggers yet</h3>
            <p className="text-text-secondary mb-4">Create your first trigger to automate actions based on livestream events.</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Trigger
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {triggers.map((trigger: any) => (
              <Card key={trigger.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary">{trigger.name}</h3>
                      <p className="text-sm text-text-secondary">
                        When {trigger.event_type} → {trigger.actions_json.length} actions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={trigger.enabled ? 'success' : 'default'}>
                      {trigger.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
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
    </div>
  )
}
