import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import {
  GraphConnection, GraphNode, NodePort, NodePortDefinition
} from './types'
import { NodeManager } from './NodeManager'

const logger = new Logger('ConnectionManager')

/**
 * ConnectionManager - Manages graph connections (edges between nodes)
 *
 * Responsibilities:
 * - Create connections between node ports
 * - Validate connection compatibility
 * - Remove connections
 * - Find connections by node/port
 * - Prevent circular connections
 */
export class ConnectionManager extends EventEmitter {
  private static instance: ConnectionManager
  private nodeManager: NodeManager

  private constructor() {
    super()
    this.nodeManager = NodeManager.getInstance()
  }

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  /**
   * Create a connection between two ports
   */
  createConnection(
    connections: GraphConnection[],
    from: NodePort,
    to: NodePort,
    nodes: GraphNode[]
  ): GraphConnection | null {
    // Validate the connection
    const validation = this.validateConnection(connections, from, to, nodes)
    if (!validation.valid) {
      logger.warning(`Invalid connection: ${validation.error}`)
      return null
    }

    const connection: GraphConnection = {
      id: this.generateId(),
      from,
      to
    }

    connections.push(connection)
    this.emit('connectionCreated', connection)
    logger.debug(`Connection created: ${from.nodeId}:${from.portName} → ${to.nodeId}:${to.portName}`)

    return connection
  }

  /**
   * Validate a connection
   */
  validateConnection(
    connections: GraphConnection[],
    from: NodePort,
    to: NodePort,
    nodes: GraphNode[]
  ): { valid: boolean; error?: string } {
    // Can't connect to self
    if (from.nodeId === to.nodeId) {
      return { valid: false, error: 'Cannot connect node to itself' }
    }

    // Find the nodes
    const fromNode = nodes.find(n => n.id === from.nodeId)
    const toNode = nodes.find(n => n.id === to.nodeId)
    if (!fromNode || !toNode) {
      return { valid: false, error: 'Node not found' }
    }

    // Get node definitions
    const fromDef = this.nodeManager.get(fromNode.type)
    const toDef = this.nodeManager.get(toNode.type)
    if (!fromDef || !toDef) {
      return { valid: false, error: 'Node type not found' }
    }

    // Find the port definitions
    const fromPort = fromDef.outputs.find(p => p.name === from.portName)
    const toPort = toDef.inputs.find(p => p.name === to.portName)
    if (!fromPort) {
      return { valid: false, error: `Output port "${from.portName}" not found on ${fromNode.type}` }
    }
    if (!toPort) {
      return { valid: false, error: `Input port "${to.portName}" not found on ${toNode.type}` }
    }

    // Check if input port already has a connection
    const existingInput = connections.find(
      c => c.to.nodeId === to.nodeId && c.to.portName === to.portName
    )
    if (existingInput) {
      return { valid: false, error: `Input port "${to.portName}" already connected` }
    }

    // Check port type compatibility
    if (!this.arePortsCompatible(fromPort, toPort)) {
      return { valid: false, error: 'Port types are not compatible' }
    }

    // Check for circular connections
    if (this.wouldCreateCycle(connections, from, to, nodes)) {
      return { valid: false, error: 'Connection would create a cycle' }
    }

    return { valid: true }
  }

  /**
   * Check if two ports are compatible
   */
  private arePortsCompatible(
    from: NodePortDefinition,
    to: NodePortDefinition
  ): boolean {
    // 'any' type is compatible with everything
    if (from.type === 'any' || to.type === 'any') return true
    // 'signal' connects to 'signal'
    if (from.type === 'signal' && to.type === 'signal') return true
    // 'data' connects to 'data' or 'any'
    if (from.type === 'data' && (to.type === 'data' || to.type === 'any')) return true
    // 'event' connects to 'event' or 'any'
    if (from.type === 'event' && (to.type === 'event' || to.type === 'any')) return true
    return false
  }

  /**
   * Check if adding a connection would create a cycle
   */
  private wouldCreateCycle(
    connections: GraphConnection[],
    from: NodePort,
    to: NodePort,
    nodes: GraphNode[]
  ): boolean {
    // DFS from the 'to' node to see if we can reach the 'from' node
    const visited = new Set<string>()
    const stack = [from.nodeId]

    while (stack.length > 0) {
      const current = stack.pop()!
      if (current === to.nodeId) return true
      if (visited.has(current)) continue
      visited.add(current)

      // Find all nodes that this node connects TO
      for (const conn of connections) {
        if (conn.from.nodeId === current) {
          stack.push(conn.to.nodeId)
        }
      }
    }

    return false
  }

  /**
   * Remove a connection by ID
   */
  removeConnection(
    connections: GraphConnection[],
    connectionId: string
  ): boolean {
    const index = connections.findIndex(c => c.id === connectionId)
    if (index === -1) return false

    const removed = connections.splice(index, 1)[0]
    this.emit('connectionRemoved', removed)
    logger.debug(`Connection removed: ${removed.from.nodeId} → ${removed.to.nodeId}`)

    return true
  }

  /**
   * Remove all connections for a node
   */
  removeNodeConnections(
    connections: GraphConnection[],
    nodeId: string
  ): number {
    const before = connections.length
    const remaining = connections.filter(
      c => c.from.nodeId !== nodeId && c.to.nodeId !== nodeId
    )
    connections.length = 0
    connections.push(...remaining)

    const removed = before - connections.length
    if (removed > 0) {
      logger.debug(`Removed ${removed} connections for node ${nodeId}`)
    }
    return removed
  }

  /**
   * Get all connections for a node
   */
  getNodeConnections(
    connections: GraphConnection[],
    nodeId: string
  ): GraphConnection[] {
    return connections.filter(
      c => c.from.nodeId === nodeId || c.to.nodeId === nodeId
    )
  }

  /**
   * Get connections from a specific output port
   */
  getOutputConnections(
    connections: GraphConnection[],
    nodeId: string,
    portName: string
  ): GraphConnection[] {
    return connections.filter(
      c => c.from.nodeId === nodeId && c.from.portName === portName
    )
  }

  /**
   * Get connection to a specific input port
   */
  getInputConnection(
    connections: GraphConnection[],
    nodeId: string,
    portName: string
  ): GraphConnection | undefined {
    return connections.find(
      c => c.to.nodeId === nodeId && c.to.portName === portName
    )
  }

  /**
   * Get upstream nodes (nodes that connect to this node's inputs)
   */
  getUpstreamNodes(
    connections: GraphConnection[],
    nodeId: string
  ): string[] {
    const upstream = new Set<string>()
    for (const conn of connections) {
      if (conn.to.nodeId === nodeId) {
        upstream.add(conn.from.nodeId)
      }
    }
    return Array.from(upstream)
  }

  /**
   * Get downstream nodes (nodes that this node's outputs connect to)
   */
  getDownstreamNodes(
    connections: GraphConnection[],
    nodeId: string
  ): string[] {
    const downstream = new Set<string>()
    for (const conn of connections) {
      if (conn.from.nodeId === nodeId) {
        downstream.add(conn.to.nodeId)
      }
    }
    return Array.from(downstream)
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }
}
