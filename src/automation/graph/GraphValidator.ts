import { Logger } from '@services/logger'
import { AutomationGraph, GraphNode, GraphConnection } from './types'
import { NodeManager } from './NodeManager'

const logger = new Logger('GraphValidator')

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  type: 'node' | 'connection' | 'graph'
  id?: string
  message: string
}

export interface ValidationWarning {
  type: 'node' | 'connection' | 'graph'
  id?: string
  message: string
}

/**
 * GraphValidator - Validates graph structure and configuration
 *
 * Responsibilities:
 * - Validate graph structure
 * - Validate node configurations
 * - Validate connections
 * - Check for orphan nodes
 * - Check for unreachable nodes
 */
export class GraphValidator {
  private static instance: GraphValidator
  private nodeManager: NodeManager

  private constructor() {
    this.nodeManager = NodeManager.getInstance()
  }

  static getInstance(): GraphValidator {
    if (!GraphValidator.instance) {
      GraphValidator.instance = new GraphValidator()
    }
    return GraphValidator.instance
  }

  /**
   * Validate a complete graph
   */
  validate(graph: AutomationGraph): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Validate graph-level properties
    this.validateGraph(graph, errors, warnings)

    // Validate each node
    for (const node of graph.nodes) {
      this.validateNode(node, graph, errors, warnings)
    }

    // Validate each connection
    for (const conn of graph.connections) {
      this.validateConnection(conn, graph, errors, warnings)
    }

    // Check for orphan nodes (no connections)
    this.checkOrphanNodes(graph, warnings)

    // Check for unreachable nodes
    this.checkUnreachableNodes(graph, warnings)

    // Check for event nodes
    this.checkEventNodes(graph, warnings)

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings
    }

    if (errors.length > 0) {
      logger.warning(`Graph validation failed with ${errors.length} errors`)
    }

    return result
  }

  /**
   * Validate graph-level properties
   */
  private validateGraph(
    graph: AutomationGraph,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!graph.name || graph.name.trim().length === 0) {
      errors.push({ type: 'graph', message: 'Graph name is required' })
    }

    if (graph.nodes.length === 0) {
      warnings.push({ type: 'graph', message: 'Graph has no nodes' })
    }
  }

  /**
   * Validate a single node
   */
  private validateNode(
    node: GraphNode,
    graph: AutomationGraph,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const definition = this.nodeManager.get(node.type)

    if (!definition) {
      errors.push({
        type: 'node',
        id: node.id,
        message: `Unknown node type: ${node.type}`
      })
      return
    }

    // Validate node position
    if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      errors.push({
        type: 'node',
        id: node.id,
        message: 'Invalid node position'
      })
    }

    // Validate node config using factory
    const instance = this.nodeManager.createNode(node.type)
    if (instance && !instance.validate(node.config)) {
      warnings.push({
        type: 'node',
        id: node.id,
        message: `Node "${definition.name}" has invalid configuration`
      })
    }
  }

  /**
   * Validate a connection
   */
  private validateConnection(
    conn: GraphConnection,
    graph: AutomationGraph,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check if from node exists
    const fromNode = graph.nodes.find(n => n.id === conn.from.nodeId)
    if (!fromNode) {
      errors.push({
        type: 'connection',
        id: conn.id,
        message: `Source node not found: ${conn.from.nodeId}`
      })
      return
    }

    // Check if to node exists
    const toNode = graph.nodes.find(n => n.id === conn.to.nodeId)
    if (!toNode) {
      errors.push({
        type: 'connection',
        id: conn.id,
        message: `Target node not found: ${conn.to.nodeId}`
      })
      return
    }

    // Check if from port exists
    const fromDef = this.nodeManager.get(fromNode.type)
    if (fromDef && !fromDef.outputs.some(p => p.name === conn.from.portName)) {
      errors.push({
        type: 'connection',
        id: conn.id,
        message: `Output port not found: ${conn.from.portName}`
      })
    }

    // Check if to port exists
    const toDef = this.nodeManager.get(toNode.type)
    if (toDef && !toDef.inputs.some(p => p.name === conn.to.portName)) {
      errors.push({
        type: 'connection',
        id: conn.id,
        message: `Input port not found: ${conn.to.portName}`
      })
    }
  }

  /**
   * Check for nodes with no connections
   */
  private checkOrphanNodes(
    graph: AutomationGraph,
    warnings: ValidationWarning[]
  ): void {
    for (const node of graph.nodes) {
      const hasConnection = graph.connections.some(
        c => c.from.nodeId === node.id || c.to.nodeId === node.id
      )
      if (!hasConnection) {
        const def = this.nodeManager.get(node.type)
        warnings.push({
          type: 'node',
          id: node.id,
          message: `Node "${def?.name || node.type}" is not connected`
        })
      }
    }
  }

  /**
   * Check for nodes that can't be reached from any event node
   */
  private checkUnreachableNodes(
    graph: AutomationGraph,
    warnings: ValidationWarning[]
  ): void {
    // Find all event nodes
    const eventNodes = graph.nodes.filter(n => n.type.startsWith('event:'))
    if (eventNodes.length === 0) return

    // BFS from event nodes
    const reachable = new Set<string>()
    const queue = eventNodes.map(n => n.id)

    while (queue.length > 0) {
      const current = queue.shift()!
      if (reachable.has(current)) continue
      reachable.add(current)

      // Find downstream nodes
      for (const conn of graph.connections) {
        if (conn.from.nodeId === current && !reachable.has(conn.to.nodeId)) {
          queue.push(conn.to.nodeId)
        }
      }
    }

    // Check for unreachable non-event nodes
    for (const node of graph.nodes) {
      if (!node.type.startsWith('event:') && !reachable.has(node.id)) {
        const def = this.nodeManager.get(node.type)
        warnings.push({
          type: 'node',
          id: node.id,
          message: `Node "${def?.name || node.type}" is unreachable from any event`
        })
      }
    }
  }

  /**
   * Check if graph has event nodes
   */
  private checkEventNodes(
    graph: AutomationGraph,
    warnings: ValidationWarning[]
  ): void {
    const eventNodes = graph.nodes.filter(n => n.type.startsWith('event:'))
    if (eventNodes.length === 0) {
      warnings.push({
        type: 'graph',
        message: 'Graph has no event trigger nodes'
      })
    }
  }
}
