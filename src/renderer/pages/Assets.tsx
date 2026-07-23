import { useState, useEffect } from 'react'
import { Card, Button } from '../components/ui'
import { Plus, Image, Film, Music, FileText } from 'lucide-react'

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    try {
      const data = await window.maulfinity.asset.list()
      setAssets(data)
    } catch (error) {
      console.error('Failed to load assets:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" />
      case 'video': return <Film className="w-5 h-5" />
      case 'audio': return <Music className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Assets</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Import Asset
        </Button>
      </div>

      <div className="flex gap-2">
        {['all', 'image', 'video', 'audio'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === type
                ? 'bg-primary text-white'
                : 'bg-bg-input text-text-secondary hover:bg-border'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {assets.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <p className="text-text-secondary">No assets imported yet</p>
          </Card>
        ) : (
          assets.map((asset: any) => (
            <Card key={asset.id} className="p-4">
              <div className="aspect-square bg-bg-dark rounded-lg flex items-center justify-center mb-3">
                {getTypeIcon(asset.type)}
              </div>
              <p className="text-sm font-medium text-text-primary truncate">{asset.name}</p>
              <p className="text-xs text-text-secondary">{asset.type}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
