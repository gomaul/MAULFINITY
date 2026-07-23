import { ipcMain } from 'electron'
import { GraphManager } from '../../automation/graph/GraphManager'
import { NodeManager } from '../../automation/graph/NodeManager'
import { ConnectionManager } from '../../automation/graph/ConnectionManager'
import { GraphSerializer } from '../../automation/graph/GraphSerializer'
import { GraphValidator } from '../../automation/graph/GraphValidator'
import { DebugManager } from '../../automation/graph/DebugManager'
import { AutomationGraph, GraphNode, GraphConnection, GraphVariable, MaulGraphFile } from '../../automation/graph/types'

const graphManager = GraphManager.getInstance()
const nodeManager = NodeManager.getInstance()
const connectionManager = ConnectionManager.getInstance()
const graphSerializer = GraphSerializer.getInstance()
const graphValidator = GraphValidator.getInstance()
const debugManager = DebugManager.getInstance()

// Lazy initialization for GraphRepository (database may not be ready at import time)
let graphRepo: ReturnType<typeof import('../../services/database/repositories/GraphRepository').GraphRepository> | null = null
function getGraphRepo() {
  if (!graphRepo) {
    const { GraphRepository } = require('../../services/database/repositories/GraphRepository')
    graphRepo = new GraphRepository()
  }
  return graphRepo
}

/**
 * Register graph IPC handlers
 */
export function registerGraphIpc(): void {
  // ============================================================
  // GRAPH CRUD
  // ============================================================

  ipcMain.handle('graph:list', async () => {
    try {
      const graphs = graphManager.getAll()
      return { success: true, data: graphs }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('graph:get', async (_event, graphId: string) => {
    try {
      const graph = graphManager.getById(graphId)
      return { success: true, data: graph }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('graph:new', async (_event, data: { name: string; description?: string }) => {
    try {
      const graph = graphManager.create(data)
      return { success: true, data: graph }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('graph:save', async (_event, graph: AutomationGraph) => {
    try {
      graphManager.load(graph)
      // Persist to database
      const repo = getGraphRepo()
      const existing = repo.findById(graph.id)
      if (existing) {
        repo.update(graph.id, {
          name: graph.name,
          description: graph.description,
          version: graph.version,
          author: graph.author,
          tags: graph.tags,
          graph_data: graph as unknown as Record<string, unknown>,
          enabled: graph.enabled ? 1 : 0
        })
      } else {
        repo.create({
          name: graph.name,
          description: graph.description,
          version: graph.version,
          author: graph.author,
          tags: graph.tags,
          graph_data: graph as unknown as Record<string, unknown>,
          profile_id: 'default',
          enabled: graph.enabled ? 1 : 0
        })
      }
      return { success: true, data: graph }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('graph:delete', async (_event, graphId: string) => {
    try {
      graphManager.delete(graphId)
      const repo = getGraphRepo()
      repo.delete(graphId)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('graph:toggle', async (_event, graphId: string) => {
    try {
      const graph = graphManager.toggle(graphId)
      if (graph) {
        const repo = getGraphRepo()
        repo.update(graphId, { enabled: graph.enabled ? 1 : 0 })
      }
      return { success: true, data: graph }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // NODE OPERATIONS
  // ============================================================

  ipcMain.handle('graph:addNode', async (_event, graphId: string, node: GraphNode) => {
    try {
      const added = graphManager.addNode(graphId, node)
      return { success: true, data: added }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('graph:updateNode', async (_event, graphId: string, nodeId: string, updates: Partial<GraphNode>) => {
    try {
      const updated = graphManager.updateNode(graphId, nodeId, updates)
      return { success: true, data: updated }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('graph:removeNode', async (_event, graphId: string, nodeId: string) => {
    try {
      const removed = graphManager.removeNode(graphId, nodeId)
      return { success: true, data: removed }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // CONNECTION OPERATIONS
  // ============================================================

  ipcMain.handle('graph:addConnection', async (_event, graphId: string, connection: GraphConnection) => {
    try {
      const graph = graphManager.getById(graphId)
      if (!graph) return { success: false, error: 'Graph not found' }
      const added = connectionManager.createConnection(graph.connections, connection.from, connection.to, graph.nodes)
      return { success: true, data: added }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('graph:removeConnection', async (_event, graphId: string, connectionId: string) => {
    try {
      const graph = graphManager.getById(graphId)
      if (!graph) return { success: false, error: 'Graph not found' }
      const removed = connectionManager.removeConnection(graph.connections, connectionId)
      return { success: true, data: removed }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // VARIABLE OPERATIONS
  // ============================================================

  ipcMain.handle('graph:addVariable', async (_event, graphId: string, variable: GraphVariable) => {
    try {
      graphManager.addVariable(graphId, variable)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('graph:removeVariable', async (_event, graphId: string, name: string) => {
    try {
      const removed = graphManager.removeVariable(graphId, name)
      return { success: true, data: removed }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // NODE TYPES
  // ============================================================

  ipcMain.handle('graph:getNodeTypes', async () => {
    try {
      const categories = nodeManager.getCategories()
      return { success: true, data: categories }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('graph:getNodeType', async (_event, type: string) => {
    try {
      const def = nodeManager.get(type)
      return { success: true, data: def }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // VALIDATION
  // ============================================================

  ipcMain.handle('graph:validate', async (_event, graph: AutomationGraph) => {
    try {
      const result = graphValidator.validate(graph)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // EXECUTE (DEBUG)
  // ============================================================

  ipcMain.handle('graph:execute', async (_event, graphId: string, eventData: Record<string, unknown>) => {
    try {
      const graph = graphManager.getById(graphId)
      if (!graph) return { success: false, error: 'Graph not found' }
      const result = await debugManager.executeGraph(graph, eventData)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // EXPORT / IMPORT
  // ============================================================

  ipcMain.handle('graph:export', async (_event, graphId: string) => {
    try {
      const graph = graphManager.getById(graphId)
      if (!graph) return { success: false, error: 'Graph not found' }
      const file = graphSerializer.serialize(graph)
      return { success: true, data: file }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('graph:import', async (_event, data: MaulGraphFile) => {
    try {
      const validation = graphSerializer.validateFile(data)
      if (!validation.valid) {
        return { success: false, error: `Invalid file: ${validation.errors.join(', ')}` }
      }
      const graph = graphSerializer.deserialize(data)
      graphManager.load(graph)
      return { success: true, data: graph }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // ============================================================
  // STATS
  // ============================================================

  ipcMain.handle('graph:getStats', async () => {
    try {
      const stats = graphManager.getStats()
      return { success: true, data: stats }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  console.log('Graph IPC handlers registered')
}
