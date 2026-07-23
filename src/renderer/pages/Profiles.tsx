import { useState, useEffect } from 'react'
import { Card, Button, Modal, Input } from '../components/ui'
import { Plus, User, Trash2 } from 'lucide-react'

export default function Profiles() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const data = await window.maulfinity.profile.list()
      setProfiles(data)
    } catch (error) {
      console.error('Failed to load profiles:', error)
    }
  }

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return

    try {
      await window.maulfinity.profile.create({ name: newProfileName } as any)
      setNewProfileName('')
      setIsModalOpen(false)
      await loadProfiles()
    } catch (error) {
      console.error('Failed to create profile:', error)
    }
  }

  const handleDeleteProfile = async (id: string) => {
    try {
      await window.maulfinity.profile.delete(id)
      await loadProfiles()
    } catch (error) {
      console.error('Failed to delete profile:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Profiles</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile: any) => (
          <Card key={profile.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{profile.name}</h3>
                  <p className="text-sm text-text-secondary">
                    {profile.description || 'No description'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteProfile(profile.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Profile"
      >
        <div className="space-y-4">
          <Input
            label="Profile Name"
            placeholder="e.g., GTA Stream, Minecraft Stream"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProfile}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
