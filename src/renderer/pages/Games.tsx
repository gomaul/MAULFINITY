import { useState, useEffect } from 'react'
import { Card, Button, Modal, Input } from '../components/ui'

interface GameStatus {
  game: {
    id: string
    name: string
    adapter: string
    status: string
    enabled: number
  }
  connected: boolean
  state: string | null
}

interface GameStateData {
  adapterState: string | null
  gameState: {
    players: Array<{
      id: string
      name: string
      health: number
      armor: number
      position: { x: number; y: number; z: number }
      money: number
      wantedLevel: number
    }>
    vehicles: Array<{
      id: string
      model: string
      health: number
      speed: number
    }>
    world: {
      weather: string
      time: { hour: number; minute: number }
    }
  } | null
}

export default function Games() {
  const [games, setGames] = useState<GameStatus[]>([])
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [gameState, setGameState] = useState<GameStateData | null>(null)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [testEvent, setTestEvent] = useState({ type: '', data: '{}' })

  // New game form
  const [newGame, setNewGame] = useState({
    id: '',
    name: '',
    adapter: 'GTAAdapter',
    description: ''
  })

  // Load games
  useEffect(() => {
    loadGames()
  }, [])

  // Load game state when selected
  useEffect(() => {
    if (selectedGame) {
      loadGameState(selectedGame)
    }
  }, [selectedGame])

  const loadGames = async () => {
    try {
      const result = await window.maulfinity?.game?.getAllStatus()
      if (result?.success) {
        setGames(result.data)
      }
    } catch (error) {
      console.error('Failed to load games:', error)
    }
  }

  const loadGameState = async (gameId: string) => {
    try {
      const result = await window.maulfinity?.game?.getState(gameId)
      if (result?.success) {
        setGameState(result.data)
      }
    } catch (error) {
      console.error('Failed to load game state:', error)
    }
  }

  const handleConnect = async (gameId: string) => {
    try {
      await window.maulfinity?.game?.connect(gameId)
      loadGames()
      if (selectedGame === gameId) {
        loadGameState(gameId)
      }
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  const handleDisconnect = async (gameId: string) => {
    try {
      await window.maulfinity?.game?.disconnect(gameId)
      loadGames()
      setGameState(null)
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const handleRegister = async () => {
    try {
      await window.maulfinity?.game?.register(newGame)
      setShowRegisterModal(false)
      loadGames()
      setNewGame({ id: '', name: '', adapter: 'GTAAdapter', description: '' })
    } catch (error) {
      console.error('Failed to register game:', error)
    }
  }

  const handleRemove = async (gameId: string) => {
    if (confirm('Are you sure you want to remove this game?')) {
      try {
        await window.maulfinity?.game?.remove(gameId)
        loadGames()
        if (selectedGame === gameId) {
          setSelectedGame(null)
          setGameState(null)
        }
      } catch (error) {
        console.error('Failed to remove game:', error)
      }
    }
  }

  const handleTestEvent = async () => {
    if (!selectedGame || !testEvent.type) return

    try {
      const eventData = JSON.parse(testEvent.data)
      const result = await window.maulfinity?.game?.testEvent(selectedGame, testEvent.type, eventData)
      if (result?.success) {
        console.log('Normalized event:', result.data)
        alert('Event normalized successfully! Check console for details.')
      }
    } catch (error) {
      console.error('Failed to test event:', error)
      alert('Invalid JSON or test failed')
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Game Integration</h1>
        <Button onClick={() => setShowRegisterModal(true)}>
          + Add Game
        </Button>
      </div>

      <div className="flex-1 flex gap-4">
        {/* Left Panel - Installed Games */}
        <div className="w-80 flex flex-col gap-4">
          <Card className="flex-1 overflow-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Installed Games</h2>
              
              {games.length === 0 ? (
                <p className="text-gray-400 text-sm">No games installed</p>
              ) : (
                <div className="space-y-2">
                  {games.map((item) => (
                    <div
                      key={item.game.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedGame === item.game.id
                          ? 'bg-blue-600/30 border border-blue-500'
                          : 'bg-gray-800/50 hover:bg-gray-700/50 border border-transparent'
                      }`}
                      onClick={() => setSelectedGame(item.game.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{item.game.name}</div>
                          <div className="text-xs text-gray-400">{item.game.adapter}</div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          item.connected ? 'bg-green-500' : 'bg-gray-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Center Panel - Connection Status */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Connection Status</h2>
              
              {selectedGame ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      gameState?.adapterState === 'connected' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-white">
                      {gameState?.adapterState || 'Disconnected'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleConnect(selectedGame)}
                      disabled={gameState?.adapterState === 'connected'}
                    >
                      Connect
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDisconnect(selectedGame)}
                      disabled={gameState?.adapterState !== 'connected'}
                    >
                      Disconnect
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleRemove(selectedGame)}
                      className="text-red-500"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Select a game to view status</p>
              )}
            </div>
          </Card>

          {/* Event Testing Panel */}
          <Card>
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Event Testing</h2>
              
              <div className="space-y-3">
                <Input
                  placeholder="Event type (e.g., player_death)"
                  value={testEvent.type}
                  onChange={(e) => setTestEvent({ ...testEvent, type: e.target.value })}
                />
                <textarea
                  className="w-full h-24 bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm font-mono"
                  placeholder='{"playerName": "TestPlayer", "value": 80}'
                  value={testEvent.data}
                  onChange={(e) => setTestEvent({ ...testEvent, data: e.target.value })}
                />
                <Button
                  onClick={handleTestEvent}
                  disabled={!selectedGame || !testEvent.type}
                >
                  Test Event
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Panel - Game State Inspector */}
        <div className="w-80">
          <Card className="h-full overflow-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Game State</h2>
              
              {gameState?.gameState ? (
                <div className="space-y-4">
                  {/* Players */}
                  {gameState.gameState.players.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Players</h3>
                      {gameState.gameState.players.map((player) => (
                        <div key={player.id} className="bg-gray-800/50 rounded p-2 mb-2">
                          <div className="text-white text-sm">{player.name}</div>
                          <div className="text-xs text-gray-400 space-y-1">
                            <div>HP: {player.health} | Armor: {player.armor}</div>
                            <div>Money: ${player.money.toLocaleString()}</div>
                            <div>Wanted: {'⭐'.repeat(player.wantedLevel)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vehicles */}
                  {gameState.gameState.vehicles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Vehicles</h3>
                      {gameState.gameState.vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="bg-gray-800/50 rounded p-2 mb-2">
                          <div className="text-white text-sm">{vehicle.model}</div>
                          <div className="text-xs text-gray-400">
                            HP: {vehicle.health} | Speed: {vehicle.speed.toFixed(0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* World */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">World</h3>
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-sm text-white">
                        Weather: {gameState.gameState.world.weather}
                      </div>
                      <div className="text-xs text-gray-400">
                        Time: {gameState.gameState.world.time.hour}:{String(gameState.gameState.world.time.minute).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No game state available</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Register Game Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Register Game"
      >
        <div className="space-y-4">
          <Input
            label="Game ID"
            placeholder="gta5"
            value={newGame.id}
            onChange={(e) => setNewGame({ ...newGame, id: e.target.value })}
          />
          <Input
            label="Game Name"
            placeholder="Grand Theft Auto V"
            value={newGame.name}
            onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Adapter</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              value={newGame.adapter}
              onChange={(e) => setNewGame({ ...newGame, adapter: e.target.value })}
            >
              <option value="GTAAdapter">GTA V (FiveM)</option>
              <option value="RobloxAdapter">Roblox</option>
              <option value="CustomAdapter">Custom Game</option>
            </select>
          </div>
          <Input
            label="Description"
            placeholder="Game description"
            value={newGame.description}
            onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowRegisterModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={!newGame.id || !newGame.name}>
              Register
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
