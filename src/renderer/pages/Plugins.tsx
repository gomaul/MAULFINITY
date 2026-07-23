import { useState, useEffect } from 'react'
import { Card, Button, Modal, Input } from '../components/ui'

interface Plugin {
  manifest: {
    id: string
    name: string
    version: string
    description: string
    author: string
    type: string
    permissions: string[]
  }
  state: string
  config: Record<string, unknown>
  grantedPermissions: string[]
  error?: string
  installedAt: string
  lastEnabledAt?: string
}

export default function Plugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [installData, setInstallData] = useState({
    id: '',
    name: '',
    version: '1.0.0',
    description: '',
    author: '',
    type: 'tool',
    entry: 'index.js',
    permissions: [] as string[]
  })

  const permissionCategories = {
    'Events': ['events.read', 'events.write', 'events.subscribe'],
    'Actions': ['actions.create', 'actions.execute'],
    'Graph': ['graph.register-node', 'graph.execute-node'],
    'Connectors': ['connector.register', 'connector.connect'],
    'Overlay': ['overlay.create', 'overlay.modify', 'overlay.render'],
    'Games': ['game.register-adapter', 'game.connect'],
    'Network': ['network.http', 'network.websocket'],
    'UI': ['ui.add-menu', 'ui.add-settings', 'ui.notify']
  }

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    try {
      const result = await window.maulfinity?.plugin?.list()
      if (result?.success) {
        setPlugins(result.data)
      }
    } catch (error) {
      console.error('Failed to load plugins:', error)
    }
  }

  const handleEnable = async (pluginId: string) => {
    try {
      await window.maulfinity?.plugin?.enable(pluginId)
      loadPlugins()
    } catch (error) {
      console.error('Failed to enable plugin:', error)
    }
  }

  const handleDisable = async (pluginId: string) => {
    try {
      await window.maulfinity?.plugin?.disable(pluginId)
      loadPlugins()
    } catch (error) {
      console.error('Failed to disable plugin:', error)
    }
  }

  const handleRemove = async (pluginId: string) => {
    if (confirm('Are you sure you want to remove this plugin?')) {
      try {
        await window.maulfinity?.plugin?.remove(pluginId)
        loadPlugins()
        setSelectedPlugin(null)
      } catch (error) {
        console.error('Failed to remove plugin:', error)
      }
    }
  }

  const handleInstall = async () => {
    try {
      const manifest = {
        id: installData.id,
        name: installData.name,
        version: installData.version,
        description: installData.description,
        author: installData.author,
        type: installData.type,
        entry: installData.entry,
        engines: { maulfinity: '>=0.8.0', sdk: '>=1.0.0' },
        permissions: installData.permissions
      }
      await window.maulfinity?.plugin?.install({ manifest, path: `~/.maulfinity/plugins/${installData.id}` })
      setShowInstallModal(false)
      loadPlugins()
    } catch (error) {
      console.error('Failed to install plugin:', error)
    }
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case 'enabled': return 'text-green-500'
      case 'active': return 'text-green-400'
      case 'disabled': return 'text-gray-500'
      case 'error': return 'text-red-500'
      default: return 'text-yellow-500'
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Plugin Manager</h1>
        <Button onClick={() => setShowInstallModal(true)}>
          + Install Plugin
        </Button>
      </div>

      <div className="flex-1 flex gap-4">
        {/* Left Panel - Installed Plugins */}
        <div className="w-80 flex flex-col gap-4">
          <Card className="flex-1 overflow-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Installed Plugins</h2>
              
              {plugins.length === 0 ? (
                <p className="text-gray-400 text-sm">No plugins installed</p>
              ) : (
                <div className="space-y-2">
                  {plugins.map((plugin) => (
                    <div
                      key={plugin.manifest.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedPlugin?.manifest.id === plugin.manifest.id
                          ? 'bg-blue-600/30 border border-blue-500'
                          : 'bg-gray-800/50 hover:bg-gray-700/50 border border-transparent'
                      }`}
                      onClick={() => setSelectedPlugin(plugin)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{plugin.manifest.name}</div>
                          <div className="text-xs text-gray-400">v{plugin.manifest.version}</div>
                        </div>
                        <div className={`text-xs font-medium ${getStateColor(plugin.state)}`}>
                          {plugin.state}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Center Panel - Plugin Information */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Plugin Information</h2>
              
              {selectedPlugin ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-xl font-bold text-white">{selectedPlugin.manifest.name}</div>
                    <div className="text-sm text-gray-400">by {selectedPlugin.manifest.author}</div>
                    <div className="text-sm text-gray-400">v{selectedPlugin.manifest.version}</div>
                  </div>

                  <p className="text-gray-300">{selectedPlugin.manifest.description}</p>

                  <div>
                    <div className="text-sm font-medium text-gray-400 mb-2">Type</div>
                    <div className="inline-block px-2 py-1 bg-gray-700 rounded text-sm text-white">
                      {selectedPlugin.manifest.type}
                    </div>
                  </div>

                  {selectedPlugin.error && (
                    <div className="p-3 bg-red-900/30 border border-red-500 rounded-lg">
                      <div className="text-sm font-medium text-red-400">Error</div>
                      <div className="text-sm text-red-300">{selectedPlugin.error}</div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {selectedPlugin.state === 'disabled' || selectedPlugin.state === 'installed' ? (
                      <Button onClick={() => handleEnable(selectedPlugin.manifest.id)}>
                        Enable
                      </Button>
                    ) : selectedPlugin.state === 'enabled' || selectedPlugin.state === 'active' ? (
                      <Button variant="secondary" onClick={() => handleDisable(selectedPlugin.manifest.id)}>
                        Disable
                      </Button>
                    ) : null}
                    <Button variant="secondary" onClick={() => handleRemove(selectedPlugin.manifest.id)} className="text-red-500">
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Select a plugin to view details</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel - Permissions & Settings */}
        <div className="w-80">
          <Card className="h-full overflow-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Permissions</h2>
              
              {selectedPlugin ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-400 mb-2">Required Permissions</div>
                    {selectedPlugin.manifest.permissions.length === 0 ? (
                      <p className="text-sm text-gray-500">No permissions required</p>
                    ) : (
                      <div className="space-y-1">
                        {selectedPlugin.manifest.permissions.map((perm) => (
                          <div key={perm} className="flex items-center gap-2 text-sm">
                            <div className={`w-2 h-2 rounded-full ${
                              selectedPlugin.grantedPermissions.includes(perm) 
                                ? 'bg-green-500' 
                                : 'bg-red-500'
                            }`} />
                            <span className="text-gray-300">{perm}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-400 mb-2">Installation Info</div>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div>Installed: {new Date(selectedPlugin.installedAt).toLocaleDateString()}</div>
                      {selectedPlugin.lastEnabledAt && (
                        <div>Last Enabled: {new Date(selectedPlugin.lastEnabledAt).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Select a plugin to view permissions</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Install Plugin Modal */}
      <Modal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        title="Install Plugin"
      >
        <div className="space-y-4">
          <Input
            label="Plugin ID"
            placeholder="com.example.my-plugin"
            value={installData.id}
            onChange={(e) => setInstallData({ ...installData, id: e.target.value })}
          />
          <Input
            label="Name"
            placeholder="My Plugin"
            value={installData.name}
            onChange={(e) => setInstallData({ ...installData, name: e.target.value })}
          />
          <Input
            label="Version"
            placeholder="1.0.0"
            value={installData.version}
            onChange={(e) => setInstallData({ ...installData, version: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="Plugin description"
            value={installData.description}
            onChange={(e) => setInstallData({ ...installData, description: e.target.value })}
          />
          <Input
            label="Author"
            placeholder="Author name"
            value={installData.author}
            onChange={(e) => setInstallData({ ...installData, author: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              value={installData.type}
              onChange={(e) => setInstallData({ ...installData, type: e.target.value })}
            >
              <option value="connector">Connector</option>
              <option value="action">Action</option>
              <option value="node">Node</option>
              <option value="game">Game</option>
              <option value="widget">Widget</option>
              <option value="tool">Tool</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Permissions</label>
            <div className="max-h-40 overflow-auto space-y-2">
              {Object.entries(permissionCategories).map(([category, perms]) => (
                <div key={category}>
                  <div className="text-xs font-medium text-gray-400 mb-1">{category}</div>
                  {perms.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={installData.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setInstallData({ ...installData, permissions: [...installData.permissions, perm] })
                          } else {
                            setInstallData({ ...installData, permissions: installData.permissions.filter(p => p !== perm) })
                          }
                        }}
                      />
                      {perm}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowInstallModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleInstall} disabled={!installData.id || !installData.name}>
              Install
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
