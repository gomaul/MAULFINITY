import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import {
  AutomationGraph, ExecutionContext, NodeState,
  DebugExecution, DebugLogEntry, GraphExecutionStatus
} from './types'
import { NodeManager } from './NodeManager'
import { ConnectionManager } from './ConnectionManager'

const logger = new Logger('DebugManager')

/**
 * Simple variable store for execution
 */
class ExecVariableStore {
  private vars: Map<string, unknown> = new Map()
  get(name: string) { return this.vars.get(name) }
  set(name: string, value: unknown) { this.vars.set(name, value) }
  has(name: string) { return this.vars.has(name) }
  getAll() { return Object.fromEntries(this.vars) }
}

/**
 * Simple counter store for execution
 */
class ExecCounterStore {
  private counters: Map<string, number> = new Map()
  get(name: string) { return this.counters.get(name) ?? 0 }
  increment(name: string, amount = 1) { const v = this.get(name) + amount; this.counters.set(name, v); return v }
  decrement(name: string, amount = 1) { return this.increment(name, -amount) }
  reset(name: string) { this.counters.set(name, 0) }
  getAll() { return Object.fromEntries(this.counters) }
}

/**
 * Simple cooldown store for execution
 */
class ExecCooldownStore {
  private cooldowns: Map<string, number> = new Map()
  isOnCooldown(key: string) { const exp = this.cooldowns.get(key); return exp ? Date.now() < exp : false }
  setCooldown(key: string, seconds: number) { this.cooldowns.set(key, Date.now() + seconds * 1000) }
  getRemainingCooldown(key: string) { const exp = this.cooldowns.get(key); return exp ? Math.max(0, Math.ceil((exp - Date.now()) / 1000)) : 0 }
  clear(key: string) { this.cooldowns.delete(key) }
}

/**
 * DebugManager - Handles graph execution preview and debugging
 *
 * Responsibilities:
 * - Execute graphs in debug mode
 * - Track node execution states
 * - Log execution steps
 * - Provide execution history
 */
export class DebugManager extends EventEmitter {
  private static instance: DebugManager
  private nodeManager: NodeManager
  private connectionManager: ConnectionManager
  private executions: Map<string, DebugExecution> = new Map()

  private constructor() {
    super()
    this.nodeManager = NodeManager.getInstance()
    this.connectionManager = ConnectionManager.getInstance()
  }

  static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager()
    }
    return DebugManager.instance
  }

  /**
   * Execute a graph in debug mode
   */
  async executeGraph(
    graph: AutomationGraph,
    eventData: Record<string, unknown>
  ): Promise<DebugExecution> {
    const executionId = this.generateId()
    const startTime = Date.now()

    const execution: DebugExecution = {
      executionId,
      graphId: graph.id,
      status: 'running',
      nodeStates: new Map(),
      startedAt: startTime,
      logs: []
    }

    this.executions.set(executionId, execution)
    this.log(execution, 'info', undefined, `Execution started for graph "${graph.name}"`)

    try {
      // Create execution context
      const context: ExecutionContext = {
        executionId,
        graphId: graph.id,
        triggerEvent: {
          id: `debug_${Date.now()}`,
          type: eventData.type as string || 'gift',
          platform: eventData.platform as string || 'debug',
          user: eventData.user as string || 'DebugUser',
          payload: (eventData.payload as Record<string, unknown>) || {},
          timestamp: Date.now()
        },
        startedAt: startTime,
        variables: new ExecVariableStore(),
        counters: new ExecCounterStore(),
        cooldowns: new ExecCooldownStore(),
        depth: 0,
        aborted: false,
        nodeStates: execution.nodeStates
      }

      // Find event nodes that match the event type
      const eventNodes = graph.nodes.filter(
        n => n.type.startsWith('event:') &&
             (n.type === `event:${context.triggerEvent.type}` || n.type === 'event:custom')
      )

      if (eventNodes.length === 0) {
        this.log(execution, 'warning', undefined, 'No matching event nodes found')
        execution.status = 'completed'
        return execution
      }

      // Execute starting from event nodes
      for (const eventNode of eventNodes) {
        if (execution.aborted) break
        await this.executeNode(eventNode.id, graph, context, execution)
      }

      execution.status = execution.aborted ? 'aborted' : 'completed'
      this.log(execution, 'info', undefined, `Execution completed in ${Date.now() - startTime}ms`)
    } catch (error) {
      execution.status = 'failed'
      this.log(execution, 'error', undefined, `Execution failed: ${(error as Error).message}`)
    }

    this.emit('executionComplete', execution)
    return execution
  }

  /**
   * Execute a single node and its downstream connections
   */
  private async executeNode(
    nodeId: string,
    graph: AutomationGraph,
    context: ExecutionContext,
    execution: DebugExecution
  ): Promise<void> {
    if (execution.aborted || context.depth > 100) return

    const node = graph.nodes.find(n => n.id === nodeId)
    if (!node || node.disabled) return

    const nodeState: NodeState = {
      nodeId,
      status: 'running',
      startedAt: Date.now()
    }
    execution.nodeStates.set(nodeId, nodeState)
    context.nodeStates.set(nodeId, nodeState)

    const nodeDef = this.nodeManager.get(node.type)
    this.log(execution, 'debug', nodeId, `Executing node: ${nodeDef?.name || node.type}`)

    try {
      const instance = this.nodeManager.createNode(node.type)
      if (!instance) {
        throw new Error(`Unknown node type: ${node.type}`)
      }

      const output = await instance.execute(node.config, context)

      nodeState.status = 'completed'
      nodeState.completedAt = Date.now()
      nodeState.duration = nodeState.completedAt - (nodeState.startedAt || Date.now())

      this.log(execution, 'debug', nodeId, `Node completed: output="${output.signal}"`)

      // Follow connections from the output signal
      if (output.signal) {
        context.depth++
        const downstream = this.connectionManager.getOutputConnections(
          graph.connections, nodeId, output.signal
        )

        for (const conn of downstream) {
          if (execution.aborted) break
          await this.executeNode(conn.to.nodeId, graph, context, execution)
        }
        context.depth--
      }
    } catch (error) {
      nodeState.status = 'failed'
      nodeState.completedAt = Date.now()
      nodeState.error = (error as Error).message
      this.log(execution, 'error', nodeId, `Node failed: ${(error as Error).message}`)
    }
  }

  /**
   * Abort an execution
   */
  abortExecution(executionId: string): void {
    const execution = this.executions.get(executionId)
    if (execution) {
      execution.aborted = true
      execution.status = 'aborted'
      this.log(execution, 'warning', undefined, 'Execution aborted')
      this.emit('executionAborted', execution)
    }
  }

  /**
   * Get an execution by ID
   */
  getExecution(executionId: string): DebugExecution | undefined {
    return this.executions.get(executionId)
  }

  /**
   * Get all executions
   */
  getExecutions(): DebugExecution[] {
    return Array.from(this.executions.values())
  }

  /**
   * Add a log entry
   */
  private log(
    execution: DebugExecution,
    level: DebugLogEntry['level'],
    nodeId: string | undefined,
    message: string
  ): void {
    const entry: DebugLogEntry = {
      timestamp: Date.now(),
      level,
      nodeId,
      message
    }
    execution.logs.push(entry)
    this.emit('log', { executionId: execution.executionId, entry })
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executions.clear()
    this.emit('historyCleared')
  }

  private generateId(): string {
    return `debug_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }
}
