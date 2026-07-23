import { Logger } from '@services/logger'
import {
  AutomationGraph, MaulGraphFile, GraphNode,
  GraphConnection, GraphVariable, DEFAULT_GRAPH_SETTINGS
} from './types'

const logger = new Logger('GraphSerializer')

/**
 * GraphSerializer - Handles save/load of graphs in .maulgraph format
 *
 * Responsibilities:
 * - Serialize graph to .maulgraph JSON
 * - Deserialize .maulgraph JSON to graph
 * - Validate file format
 * - Import/export graphs
 */
export class GraphSerializer {
  private static instance: GraphSerializer

  private constructor() {}

  static getInstance(): GraphSerializer {
    if (!GraphSerializer.instance) {
      GraphSerializer.instance = new GraphSerializer()
    }
    return GraphSerializer.instance
  }

  /**
   * Serialize a graph to .maulgraph format
   */
  serialize(graph: AutomationGraph): MaulGraphFile {
    const file: MaulGraphFile = {
      version: '1.0.0',
      metadata: {
        name: graph.name,
        description: graph.description,
        author: graph.author,
        createdAt: graph.createdAt,
        updatedAt: graph.updatedAt,
        tags: graph.tags
      },
      nodes: graph.nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: { ...n.position },
        config: { ...n.config },
        disabled: n.disabled
      })),
      connections: graph.connections.map(c => ({
        id: c.id,
        from: { ...c.from },
        to: { ...c.to }
      })),
      variables: graph.variables.map(v => ({
        name: v.name,
        type: v.type,
        defaultValue: v.defaultValue,
        description: v.description
      })),
      settings: { ...graph.settings }
    }

    logger.debug(`Serialized graph: ${graph.name} (${graph.nodes.length} nodes, ${graph.connections.length} connections)`)
    return file
  }

  /**
   * Deserialize a .maulgraph file to a graph
   */
  deserialize(file: MaulGraphFile, id?: string): AutomationGraph {
    const now = new Date().toISOString()

    const graph: AutomationGraph = {
      id: id || this.generateId(),
      name: file.metadata.name,
      description: file.metadata.description,
      version: file.version,
      author: file.metadata.author,
      tags: file.metadata.tags || [],
      nodes: file.nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: { ...n.position },
        config: { ...n.config },
        disabled: n.disabled
      })),
      connections: file.connections.map(c => ({
        id: c.id,
        from: { ...c.from },
        to: { ...c.to }
      })),
      variables: file.variables.map(v => ({
        name: v.name,
        type: v.type,
        defaultValue: v.defaultValue,
        description: v.description
      })),
      settings: file.settings || { ...DEFAULT_GRAPH_SETTINGS },
      enabled: true,
      createdAt: file.metadata.createdAt || now,
      updatedAt: file.metadata.updatedAt || now
    }

    logger.debug(`Deserialized graph: ${graph.name} (${graph.nodes.length} nodes)`)
    return graph
  }

  /**
   * Convert graph to JSON string
   */
  toJSON(graph: AutomationGraph): string {
    const file = this.serialize(graph)
    return JSON.stringify(file, null, 2)
  }

  /**
   * Parse JSON string to graph
   */
  fromJSON(json: string, id?: string): AutomationGraph {
    const file = JSON.parse(json) as MaulGraphFile
    return this.deserialize(file, id)
  }

  /**
   * Validate a .maulgraph file structure
   */
  validateFile(data: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Invalid file format'] }
    }

    const file = data as Record<string, unknown>

    // Check version
    if (!file.version || typeof file.version !== 'string') {
      errors.push('Missing or invalid version')
    }

    // Check metadata
    if (!file.metadata || typeof file.metadata !== 'object') {
      errors.push('Missing metadata')
    } else {
      const meta = file.metadata as Record<string, unknown>
      if (!meta.name || typeof meta.name !== 'string') {
        errors.push('Missing metadata.name')
      }
    }

    // Check nodes
    if (!Array.isArray(file.nodes)) {
      errors.push('Missing or invalid nodes array')
    } else {
      for (const node of file.nodes) {
        if (!node.id || !node.type || !node.position) {
          errors.push(`Invalid node: ${JSON.stringify(node)}`)
        }
      }
    }

    // Check connections
    if (!Array.isArray(file.connections)) {
      errors.push('Missing or invalid connections array')
    } else {
      for (const conn of file.connections) {
        if (!conn.id || !conn.from || !conn.to) {
          errors.push(`Invalid connection: ${JSON.stringify(conn)}`)
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Create a template graph
   */
  createTemplate(name: string): AutomationGraph {
    const now = new Date().toISOString()
    return {
      id: this.generateId(),
      name,
      description: '',
      version: '1.0.0',
      author: 'User',
      tags: [],
      nodes: [],
      connections: [],
      variables: [],
      settings: { ...DEFAULT_GRAPH_SETTINGS },
      enabled: true,
      createdAt: now,
      updatedAt: now
    }
  }

  private generateId(): string {
    return `graph_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }
}
