import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import {
  AutomationGraph, GraphNode, GraphConnection,
  GraphVariable, GraphSettings, DEFAULT_GRAPH_SETTINGS
} from './types'

const logger = new Logger('GraphManager')

/**
 * GraphManager - Manages automation graph CRUD operations
 *
 * Responsibilities:
 * - Create, Read, Update, Delete graphs
 * - In-memory graph storage
 * - Graph state management
 * - Enable/disable graphs
 */
export class GraphManager extends EventEmitter {
  private static instance: GraphManager
  private graphs: Map<string, AutomationGraph> = new Map()

  private constructor() {
    super()
  }

  static getInstance(): GraphManager {
    if (!GraphManager.instance) {
      GraphManager.instance = new GraphManager()
    }
    return GraphManager.instance
  }

  /**
   * Create a new graph
   */
  create(data: {
    name: string
    description?: string
    author?: string
    tags?: string[]
    profileId?: string
  }): AutomationGraph {
    const now = new Date().toISOString()
    const graph: AutomationGraph = {
      id: this.generateId(),
      name: data.name,
      description: data.description || '',
      version: '1.0.0',
      author: data.author || 'User',
      tags: data.tags || [],
      nodes: [],
      connections: [],
      variables: [],
      settings: { ...DEFAULT_GRAPH_SETTINGS },
      enabled: true,
      createdAt: now,
      updatedAt: now
    }

    this.graphs.set(graph.id, graph)
    this.emit('graphCreated', graph)
    logger.info(`Graph created: ${graph.name} (${graph.id})`)

    return graph
  }

  /**
   * Get graph by ID
   */
  getById(id: string): AutomationGraph | undefined {
    return this.graphs.get(id)
  }

  /**
   * Get all graphs
   */
  getAll(): AutomationGraph[] {
    return Array.from(this.graphs.values())
  }

  /**
   * Update a graph
   */
  update(id: string, updates: Partial<AutomationGraph>): AutomationGraph | undefined {
    const existing = this.graphs.get(id)
    if (!existing) {
      logger.warning(`Graph not found: ${id}`)
      return undefined
    }

    const updated: AutomationGraph = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    }

    this.graphs.set(id, updated)
    this.emit('graphUpdated', updated)
    logger.info(`Graph updated: ${updated.name}`)

    return updated
  }

  /**
   * Delete a graph
   */
  delete(id: string): boolean {
    const graph = this.graphs.get(id)
    if (!graph) return false

    this.graphs.delete(id)
    this.emit('graphDeleted', graph)
    logger.info(`Graph deleted: ${graph.name}`)

    return true
  }

  /**
   * Toggle graph enabled state
   */
  toggle(id: string): AutomationGraph | undefined {
    const graph = this.graphs.get(id)
    if (!graph) return undefined

    graph.enabled = !graph.enabled
    graph.updatedAt = new Date().toISOString()
    this.emit('graphToggled', graph)
    logger.info(`Graph ${graph.enabled ? 'enabled' : 'disabled'}: ${graph.name}`)

    return graph
  }

  /**
   * Load a graph (from database or file)
   */
  load(graph: AutomationGraph): void {
    this.graphs.set(graph.id, graph)
    this.emit('graphLoaded', graph)
    logger.info(`Graph loaded: ${graph.name}`)
  }

  /**
   * Load multiple graphs
   */
  loadAll(graphs: AutomationGraph[]): void {
    for (const graph of graphs) {
      this.graphs.set(graph.id, graph)
    }
    logger.info(`Loaded ${graphs.length} graphs`)
  }

  // ============================================================
  // NODE OPERATIONS
  // ============================================================

  /**
   * Add a node to a graph
   */
  addNode(graphId: string, node: GraphNode): GraphNode | undefined {
    const graph = this.graphs.get(graphId)
    if (!graph) return undefined

    graph.nodes.push(node)
    graph.updatedAt = new Date().toISOString()
    this.emit('nodeAdded', { graphId, node })

    return node
  }

  /**
   * Update a node in a graph
   */
  updateNode(graphId: string, nodeId: string, updates: Partial<GraphNode>): GraphNode | undefined {
    const graph = this.graphs.get(graphId)
    if (!graph) return undefined

    const node = graph.nodes.find(n => n.id === nodeId)
    if (!node) return undefined

    Object.assign(node, updates)
    graph.updatedAt = new Date().toISOString()
    this.emit('nodeUpdated', { graphId, node })

    return node
  }

  /**
   * Remove a node from a graph
   */
  removeNode(graphId: string, nodeId: string): boolean {
    const graph = this.graphs.get(graphId)
    if (!graph) return false

    const index = graph.nodes.findIndex(n => n.id === nodeId)
    if (index === -1) return false

    const removed = graph.nodes.splice(index, 1)[0]

    // Remove connections involving this node
    graph.connections = graph.connections.filter(
      c => c.from.nodeId !== nodeId && c.to.nodeId !== nodeId
    )

    graph.updatedAt = new Date().toISOString()
    this.emit('nodeRemoved', { graphId, node: removed })

    return true
  }

  /**
   * Get a node from a graph
   */
  getNode(graphId: string, nodeId: string): GraphNode | undefined {
    const graph = this.graphs.get(graphId)
    if (!graph) return undefined
    return graph.nodes.find(n => n.id === nodeId)
  }

  // ============================================================
  // CONNECTION OPERATIONS
  // ============================================================

  /**
   * Add a connection to a graph
   */
  addConnection(graphId: string, connection: GraphConnection): GraphConnection | undefined {
    const graph = this.graphs.get(graphId)
    if (!graph) return undefined

    // Check for duplicate connections
    const exists = graph.connections.some(
      c => c.from.nodeId === connection.from.nodeId &&
           c.from.portName === connection.from.portName &&
           c.to.nodeId === connection.to.nodeId &&
           c.to.portName === connection.to.portName
    )
    if (exists) return undefined

    graph.connections.push(connection)
    graph.updatedAt = new Date().toISOString()
    this.emit('connectionAdded', { graphId, connection })

    return connection
  }

  /**
   * Remove a connection from a graph
   */
  removeConnection(graphId: string, connectionId: string): boolean {
    const graph = this.graphs.get(graphId)
    if (!graph) return false

    const index = graph.connections.findIndex(c => c.id === connectionId)
    if (index === -1) return false

    const removed = graph.connections.splice(index, 1)[0]
    graph.updatedAt = new Date().toISOString()
    this.emit('connectionRemoved', { graphId, connection: removed })

    return true
  }

  /**
   * Remove all connections to/from a specific port
   */
  removeConnectionsForPort(graphId: string, nodeId: string, portName: string): number {
    const graph = this.graphs.get(graphId)
    if (!graph) return 0

    const before = graph.connections.length
    graph.connections = graph.connections.filter(
      c => !(
        (c.from.nodeId === nodeId && c.from.portName === portName) ||
        (c.to.nodeId === nodeId && c.to.portName === portName)
      )
    )
    const removed = before - graph.connections.length

    if (removed > 0) {
      graph.updatedAt = new Date().toISOString()
      this.emit('connectionsRemoved', { graphId, nodeId, portName, count: removed })
    }

    return removed
  }

  // ============================================================
  // VARIABLE OPERATIONS
  // ============================================================

  /**
   * Add a variable to a graph
   */
  addVariable(graphId: string, variable: GraphVariable): void {
    const graph = this.graphs.get(graphId)
    if (!graph) return

    graph.variables.push(variable)
    graph.updatedAt = new Date().toISOString()
    this.emit('variableAdded', { graphId, variable })
  }

  /**
   * Remove a variable from a graph
   */
  removeVariable(graphId: string, name: string): boolean {
    const graph = this.graphs.get(graphId)
    if (!graph) return false

    const index = graph.variables.findIndex(v => v.name === name)
    if (index === -1) return false

    graph.variables.splice(index, 1)
    graph.updatedAt = new Date().toISOString()
    this.emit('variableRemoved', { graphId, name })

    return true
  }

  /**
   * Update graph settings
   */
  updateSettings(graphId: string, settings: Partial<GraphSettings>): void {
    const graph = this.graphs.get(graphId)
    if (!graph) return

    graph.settings = { ...graph.settings, ...settings }
    graph.updatedAt = new Date().toISOString()
  }

  /**
   * Get graph statistics
   */
  getStats(): {
    total: number
    enabled: number
    totalNodes: number
    totalConnections: number
  } {
    const all = this.getAll()
    return {
      total: all.length,
      enabled: all.filter(g => g.enabled).length,
      totalNodes: all.reduce((sum, g) => sum + g.nodes.length, 0),
      totalConnections: all.reduce((sum, g) => sum + g.connections.length, 0)
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `graph_${timestamp}_${random}`
  }
}
