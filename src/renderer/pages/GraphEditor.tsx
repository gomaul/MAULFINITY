import { useState, useEffect, useCallback, useRef } from 'react'
import { Button, Card, Input, Modal } from '../components/ui'
import {
  Plus, Save, Play, Trash2, ZoomIn, ZoomOut, Undo2, Redo2,
  ChevronRight, ChevronDown, ChevronLeft, Bug, PlayCircle, X
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

interface GraphNode {
  id: string
  type: string
  position: { x: number; y: number }
  config: Record<string, unknown>
  disabled?: boolean
}

interface GraphConnection {
  id: string
  from: { nodeId: string; portName: string }
  to: { nodeId: string; portName: string }
}

interface AutomationGraph {
  id: string
  name: string
  description: string
  version: string
  author: string
  tags: string[]
  nodes: GraphNode[]
  connections: GraphConnection[]
  variables: Array<{ name: string; type: string; defaultValue: unknown }>
  settings: { maxExecutionDepth: number; maxParallelExecutions: number; executionTimeout: number; cooldown: number }
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface NodeDefinition {
  type: string
  category: string
  name: string
  description: string
  icon: string
  color: string
}

interface NodeState {
  nodeId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  error?: string
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function GraphEditor() {
  const [graphs, setGraphs] = useState<AutomationGraph[]>([])
  const [currentGraph, setCurrentGraph] = useState<AutomationGraph | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [nodeTypes, setNodeTypes] = useState<Record<string, NodeDefinition[]>>({})
  const [showNewModal, setShowNewModal] = useState(false)
  const [newGraphName, setNewGraphName] = useState('')
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })
  const [debugMode, setDebugMode] = useState(false)
  const [nodeStates, setNodeStates] = useState<Map<string, NodeState>>(new Map())
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragNodeId, setDragNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<SVGSVGElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; portName: string } | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Load graphs and node types
  useEffect(() => {
    loadGraphs()
    loadNodeTypes()
  }, [])

  const loadGraphs = async () => {
    try {
      const result = await window.maulfinity?.graph?.list()
      if (result?.success && result.data) {
        setGraphs(result.data)
      }
    } catch (e) {
      console.error('Failed to load graphs:', e)
    }
  }

  const loadNodeTypes = async () => {
    try {
      const result = await window.maulfinity?.graph?.getNodeTypes()
      if (result?.success && result.data) {
        const grouped: Record<string, NodeDefinition[]> = {}
        for (const cat of result.data as Array<{ category: string; nodes: NodeDefinition[] }>) {
          grouped[cat.category] = cat.nodes
        }
        setNodeTypes(grouped)
      }
    } catch (e) {
      console.error('Failed to load node types:', e)
    }
  }

  const handleNewGraph = async () => {
    if (!newGraphName.trim()) return
    try {
      const result = await window.maulfinity?.graph?.new({ name: newGraphName })
      if (result?.success && result.data) {
        setGraphs(prev => [result.data!, ...prev])
        setCurrentGraph(result.data)
        setShowNewModal(false)
        setNewGraphName('')
      }
    } catch (e) {
      console.error('Failed to create graph:', e)
    }
  }

  const handleSave = async () => {
    if (!currentGraph) return
    try {
      const result = await window.maulfinity?.graph?.save(currentGraph)
      if (result?.success) {
        loadGraphs()
      }
    } catch (e) {
      console.error('Failed to save graph:', e)
    }
  }

  const handleAddNode = (type: string) => {
    if (!currentGraph) return
    const newNode: GraphNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      config: {}
    }
    setCurrentGraph(prev => prev ? { ...prev, nodes: [...prev.nodes, newNode] } : prev)
  }

  const handleDeleteNode = (nodeId: string) => {
    if (!currentGraph) return
    setCurrentGraph(prev => prev ? {
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      connections: prev.connections.filter(c => c.from.nodeId !== nodeId && c.to.nodeId !== nodeId)
    } : prev)
    if (selectedNodeId === nodeId) setSelectedNodeId(null)
  }

  const handleNodeDrag = (nodeId: string, x: number, y: number) => {
    if (!currentGraph) return
    setCurrentGraph(prev => prev ? {
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, position: { x, y } } : n)
    } : prev)
  }

  const handleDeleteConnection = (connId: string) => {
    if (!currentGraph) return
    setCurrentGraph(prev => prev ? {
      ...prev,
      connections: prev.connections.filter(c => c.id !== connId)
    } : prev)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y })
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewport(prev => ({ ...prev, x: e.clientX - panStart.x, y: e.clientY - panStart.y }))
    }
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleCanvasMouseUp = () => {
    setIsPanning(false)
    if (connectingFrom) setConnectingFrom(null)
  }

  const handleCanvasWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.2, Math.min(3, prev.zoom * delta))
    }))
  }

  const handlePortClick = (nodeId: string, portName: string, isOutput: boolean) => {
    if (connectingFrom) {
      // Complete connection
      if (isOutput) return // Can't connect output to output
      if (connectingFrom.nodeId === nodeId) { setConnectingFrom(null); return }

      const newConn: GraphConnection = {
        id: `conn_${Date.now()}`,
        from: connectingFrom,
        to: { nodeId, portName }
      }
      setCurrentGraph(prev => prev ? { ...prev, connections: [...prev.connections, newConn] } : prev)
      setConnectingFrom(null)
    } else if (isOutput) {
      setConnectingFrom({ nodeId, portName })
    }
  }

  const handleExecute = async () => {
    if (!currentGraph) return
    setDebugMode(true)
    setNodeStates(new Map())
    setDebugLogs(['Starting execution...'])

    try {
      const result = await window.maulfinity?.graph?.execute(currentGraph.id, {
        type: 'gift', platform: 'debug', user: 'DebugUser',
        payload: { name: 'Rose', count: 1, diamonds: 10 }
      })
      if (result?.success && result.data) {
        const exec = result.data as { nodeStates: Record<string, NodeState>; logs: string[] }
        if (exec.nodeStates) {
          const map = new Map<string, NodeState>()
          for (const [k, v] of Object.entries(exec.nodeStates)) map.set(k, v)
          setNodeStates(map)
        }
        if (exec.logs) setDebugLogs(exec.logs)
      }
    } catch (e) {
      setDebugLogs(prev => [...prev, `Error: ${(e as Error).message}`])
    }
  }

  const getNodeDef = (type: string): NodeDefinition | undefined => {
    for (const nodes of Object.values(nodeTypes)) {
      const found = nodes.find(n => n.type === type)
      if (found) return found
    }
    return undefined
  }

  const screenToCanvas = (sx: number, sy: number) => ({
    x: (sx - viewport.x) / viewport.zoom,
    y: (sy - viewport.y) / viewport.zoom
  })

  const getPortPosition = (nodeId: string, portName: string, isOutput: boolean) => {
    const node = currentGraph?.nodes.find(n => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }
    const nodeW = 200
    const nodeH = 80
    return {
      x: node.position.x + (isOutput ? nodeW : 0),
      y: node.position.y + nodeH / 2
    }
  }

  const selectedNode = currentGraph?.nodes.find(n => n.id === selectedNodeId)
  const selectedNodeDef = selectedNode ? getNodeDef(selectedNode.type) : undefined

  const categoryLabels: Record<string, string> = {
    event: '🎯 Event Triggers',
    condition: '🔀 Conditions',
    logic: '⚡ Logic',
    variable: '📊 Variables & Counters',
    action: '🎮 Actions'
  }

  return (
    <div className="h-full flex flex-col gap-2 p-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-1 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!currentGraph}>
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
        </div>
        <div className="w-px h-6 bg-gray-700" />
        <select
          value={currentGraph?.id || ''}
          onChange={(e) => {
            const g = graphs.find(g => g.id === e.target.value)
            setCurrentGraph(g || null)
          }}
          className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white"
        >
          <option value="">Select Graph...</option>
          {graphs.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={() => setViewport(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <span className="text-xs text-gray-400 w-12 text-center">{Math.round(viewport.zoom * 100)}%</span>
          <Button size="sm" onClick={() => setViewport(prev => ({ ...prev, zoom: Math.max(0.2, prev.zoom / 1.2) }))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>
        <div className="w-px h-6 bg-gray-700" />
        <Button size="sm" onClick={handleExecute} disabled={!currentGraph} className="bg-green-600 hover:bg-green-700">
          <PlayCircle className="w-4 h-4 mr-1" /> Execute
        </Button>
        <Button size="sm" onClick={() => setDebugMode(!debugMode)} className={debugMode ? 'bg-yellow-600' : ''}>
          <Bug className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-2 min-h-0">
        {/* Left Panel - Node Library */}
        <div className="w-56 flex flex-col gap-2 overflow-hidden">
          <Card className="flex-1 overflow-auto p-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">Node Library</h3>
            {Object.entries(categoryLabels).map(([cat, label]) => (
              <div key={cat} className="mb-3">
                <div className="text-xs font-medium text-gray-500 mb-1 px-1">{label}</div>
                <div className="space-y-1">
                  {(nodeTypes[cat] || []).map(nodeDef => (
                    <div
                      key={nodeDef.type}
                      className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-700/50 transition-colors group"
                      onClick={() => handleAddNode(nodeDef.type)}
                      draggable
                    >
                      <span className="text-sm">{nodeDef.icon}</span>
                      <span className="text-xs text-gray-300 group-hover:text-white">{nodeDef.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Center - Graph Canvas */}
        <div className="flex-1 relative overflow-hidden bg-gray-950 rounded-lg border border-gray-700">
          {currentGraph ? (
            <svg
              ref={canvasRef}
              className="w-full h-full"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onWheel={handleCanvasWheel}
            >
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"
                  patternTransform={`translate(${viewport.x},${viewport.y}) scale(${viewport.zoom})`}>
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f2937" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              <g transform={`translate(${viewport.x},${viewport.y}) scale(${viewport.zoom})`}>
                {/* Connections */}
                {currentGraph.connections.map(conn => {
                  const from = getPortPosition(conn.from.nodeId, conn.from.portName, true)
                  const to = getPortPosition(conn.to.nodeId, conn.to.portName, false)
                  const dx = Math.abs(to.x - from.x) * 0.5
                  const path = `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`
                  return (
                    <g key={conn.id}>
                      <path d={path} fill="none" stroke="#4b5563" strokeWidth="2" className="hover:stroke-blue-500 cursor-pointer" onClick={() => handleDeleteConnection(conn.id)} />
                      <circle cx={to.x} cy={to.y} r="4" fill="#4b5563" />
                    </g>
                  )
                })}

                {/* Connecting line */}
                {connectingFrom && (
                  <line
                    x1={getPortPosition(connectingFrom.nodeId, connectingFrom.portName, true).x}
                    y1={getPortPosition(connectingFrom.nodeId, connectingFrom.portName, true).y}
                    x2={mousePos.x}
                    y2={mousePos.y}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    pointerEvents="none"
                  />
                )}

                {/* Nodes */}
                {currentGraph.nodes.map(node => {
                  const def = getNodeDef(node.type)
                  const state = nodeStates.get(node.id)
                  return (
                    <g key={node.id} transform={`translate(${node.position.x},${node.position.y})`}
                      className="cursor-move"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        setSelectedNodeId(node.id)
                        setIsDragging(true)
                        setDragNodeId(node.id)
                        setDragOffset({ x: e.clientX / viewport.zoom - node.position.x, y: e.clientY / viewport.zoom - node.position.y })
                      }}
                      onMouseMove={(e) => {
                        if (isDragging && dragNodeId === node.id) {
                          const canvasX = (e.clientX - viewport.x) / viewport.zoom
                          const canvasY = (e.clientY - viewport.y) / viewport.zoom
                          handleNodeDrag(node.id, canvasX - dragOffset.x, canvasY - dragOffset.y)
                        }
                      }}
                      onMouseUp={() => { setIsDragging(false); setDragNodeId(null) }}
                    >
                      <rect width="200" height="80" rx="8" ry="8" fill="#111827" stroke={state?.status === 'failed' ? '#ef4444' : state?.status === 'completed' ? '#10b981' : selectedNodeId === node.id ? '#3b82f6' : '#374151'} strokeWidth={selectedNodeId === node.id ? 2 : 1} />
                      <rect width="200" height="24" rx="8" ry="8" fill={def?.color || '#6b7280'} opacity="0.8" />
                      <rect x="0" y="16" width="200" height="8" fill={def?.color || '#6b7280'} opacity="0.8" />
                      <text x="10" y="16" fill="white" fontSize="11" fontWeight="500">{def?.icon || '?'} {def?.name || node.type}</text>
                      <text x="10" y="42" fill="#9ca3af" fontSize="10">{node.id.substring(0, 12)}...</text>
                      <text x="10" y="68" fill="#6b7280" fontSize="9">{JSON.stringify(node.config).substring(0, 20) || 'No config'}</text>
                      {/* Input ports */}
                      {def?.inputs?.map((port, i) => (
                        <g key={port.name} onClick={(e) => { e.stopPropagation(); handlePortClick(node.id, port.name, false) }}>
                          <circle cx="0" cy={30 + i * 20} r="5" fill="#374151" stroke="#6b7280" className="cursor-pointer hover:fill-blue-500" />
                          <text x="8" y={33 + i * 20} fill="#9ca3af" fontSize="8">{port.name}</text>
                        </g>
                      ))}
                      {/* Output ports */}
                      {def?.outputs?.map((port, i) => (
                        <g key={port.name} onClick={(e) => { e.stopPropagation(); handlePortClick(node.id, port.name, true) }}>
                          <circle cx="200" cy={30 + i * 20} r="5" fill="#374151" stroke="#6b7280" className="cursor-pointer hover:fill-green-500" />
                          <text x="180" y={33 + i * 20} fill="#9ca3af" fontSize="8" textAnchor="end">{port.name}</text>
                        </g>
                      ))}
                      {/* Debug state indicator */}
                      {debugMode && state && (
                        <circle cx="190" cy="10" r="4" fill={state.status === 'completed' ? '#10b981' : state.status === 'failed' ? '#ef4444' : state.status === 'running' ? '#f59e0b' : '#6b7280'} />
                      )}
                    </g>
                  )
                })}
              </g>
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <div className="text-sm">Select or create a graph to start editing</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Inspector */}
        <div className="w-64 flex flex-col gap-2 overflow-hidden">
          <Card className="flex-1 overflow-auto p-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Inspector</h3>
            {selectedNode && selectedNodeDef ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{selectedNodeDef.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{selectedNodeDef.name}</div>
                    <div className="text-xs text-gray-500">{selectedNodeDef.type}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{selectedNodeDef.description}</p>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Node ID</label>
                  <div className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">{selectedNode.id}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Position</label>
                  <div className="text-xs text-gray-300">X: {Math.round(selectedNode.position.x)}, Y: {Math.round(selectedNode.position.y)}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Config</label>
                  <textarea
                    value={JSON.stringify(selectedNode.config, null, 2)}
                    onChange={(e) => {
                      try {
                        const config = JSON.parse(e.target.value)
                        setCurrentGraph(prev => prev ? {
                          ...prev,
                          nodes: prev.nodes.map(n => n.id === selectedNode.id ? { ...n, config } : n)
                        } : prev)
                      } catch {}
                    }}
                    className="w-full h-32 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300 font-mono resize-none"
                  />
                </div>
                <Button size="sm" className="w-full bg-red-600 hover:bg-red-700" onClick={() => handleDeleteNode(selectedNode.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete Node
                </Button>
              </div>
            ) : currentGraph ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Graph Name</label>
                  <Input
                    value={currentGraph.name}
                    onChange={(e) => setCurrentGraph(prev => prev ? { ...prev, name: e.target.value } : prev)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Description</label>
                  <textarea
                    value={currentGraph.description}
                    onChange={(e) => setCurrentGraph(prev => prev ? { ...prev, description: e.target.value } : prev)}
                    className="w-full h-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300 resize-none"
                  />
                </div>
                <div className="text-xs text-gray-500">Nodes: {currentGraph.nodes.length} | Connections: {currentGraph.connections.length}</div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center">Select a node to inspect</div>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom Panel - Debug */}
      {debugMode && (
        <Card className="h-40 p-2 overflow-auto">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-semibold text-yellow-400 uppercase">Debug Console</h3>
            <button onClick={() => setDebugMode(false)} className="text-gray-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-0.5">
            {debugLogs.map((log, i) => (
              <div key={i} className="text-xs font-mono text-gray-400">{log}</div>
            ))}
          </div>
        </Card>
      )}

      {/* New Graph Modal */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="New Graph">
        <div className="space-y-4">
          <Input label="Graph Name" value={newGraphName} onChange={(e) => setNewGraphName(e.target.value)} placeholder="e.g., Gift Chaos" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button onClick={handleNewGraph} disabled={!newGraphName.trim()}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
