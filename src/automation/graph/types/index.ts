// ============================================================
// AUTOMATION GRAPH TYPES
// Types for the Visual Automation Graph Editor
// ============================================================

import { MaulfinityEvent } from '@shared/types'

// ============================================================
// NODE TYPES
// ============================================================

/** Node category for classification */
export type NodeCategory = 'event' | 'condition' | 'logic' | 'delay' | 'variable' | 'action'

/** Node type identifier (e.g., 'event:gift', 'condition:giftname') */
export type NodeType = string

/** Node port type */
export type PortType = 'signal' | 'data' | 'event' | 'any'

/** Node port definition */
export interface NodePortDefinition {
  name: string
  type: PortType
  required: boolean
  default?: unknown
  label?: string
  description?: string
}

/** Node config schema field */
export interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'textarea'
  label: string
  required?: boolean
  default?: unknown
  options?: { label: string; value: unknown }[]
  min?: number
  max?: number
  step?: number
  placeholder?: string
}

/** Config schema for node configuration */
export type ConfigSchema = Record<string, ConfigField>

/** Node definition for registry */
export interface NodeDefinition {
  type: NodeType
  category: NodeCategory
  name: string
  description: string
  icon: string
  color: string
  inputs: NodePortDefinition[]
  outputs: NodePortDefinition[]
  configSchema: ConfigSchema
  factory: () => BaseNode
}

/** Graph node instance in a graph */
export interface GraphNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  config: Record<string, unknown>
  disabled?: boolean
}

/** Port instance on a node */
export interface NodePort {
  nodeId: string
  portName: string
  portType: 'input' | 'output'
}

/** Graph connection between two ports */
export interface GraphConnection {
  id: string
  from: NodePort
  to: NodePort
}

/** Graph variable definition */
export interface GraphVariable {
  name: string
  type: 'number' | 'string' | 'boolean'
  defaultValue: unknown
  description?: string
}

/** Complete automation graph */
export interface AutomationGraph {
  id: string
  name: string
  description: string
  version: string
  author: string
  tags: string[]
  nodes: GraphNode[]
  connections: GraphConnection[]
  variables: GraphVariable[]
  settings: GraphSettings
  enabled: boolean
  createdAt: string
  updatedAt: string
}

/** Graph-level settings */
export interface GraphSettings {
  maxExecutionDepth: number
  maxParallelExecutions: number
  executionTimeout: number
  cooldown: number
}

/** Default graph settings */
export const DEFAULT_GRAPH_SETTINGS: GraphSettings = {
  maxExecutionDepth: 100,
  maxParallelExecutions: 5,
  executionTimeout: 30000,
  cooldown: 0
}

// ============================================================
// EXECUTION TYPES
// ============================================================

/** Node execution result */
export interface NodeExecutionResult {
  success: boolean
  output?: NodeOutput
  error?: {
    code: string
    message: string
    nodeId: string
  }
  duration: number
}

/** Node output after execution */
export interface NodeOutput {
  signal: string
  data: Record<string, unknown>
}

/** Execution context for a graph run */
export interface ExecutionContext {
  executionId: string
  graphId: string
  triggerEvent: MaulfinityEvent
  startedAt: number
  variables: VariableStore
  counters: CounterStore
  cooldowns: CooldownStore
  depth: number
  aborted: boolean
  nodeStates: Map<string, NodeState>
}

/** Node execution state */
export interface NodeState {
  nodeId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startedAt?: number
  completedAt?: number
  duration?: number
  error?: string
}

/** Variable store interface */
export interface VariableStore {
  get(name: string): unknown
  set(name: string, value: unknown): void
  has(name: string): boolean
  getAll(): Record<string, unknown>
}

/** Counter store interface */
export interface CounterStore {
  get(name: string): number
  increment(name: string, amount?: number): number
  decrement(name: string, amount?: number): number
  reset(name: string): void
  getAll(): Record<string, number>
}

/** Cooldown store interface */
export interface CooldownStore {
  isOnCooldown(key: string): boolean
  setCooldown(key: string, durationSeconds: number): void
  getRemainingCooldown(key: string): number
  clear(key: string): void
}

// ============================================================
// GRAPH STATUS TYPES
// ============================================================

/** Graph execution status */
export type GraphExecutionStatus = 'running' | 'completed' | 'failed' | 'aborted'

/** Graph execution history entry */
export interface GraphExecutionHistory {
  id: string
  graphId: string
  eventId: string
  status: GraphExecutionStatus
  startedAt: string
  completedAt?: string
  durationMs?: number
  nodesExecuted?: number
  errorMessage?: string
}

// ============================================================
// SAVE FORMAT TYPES (.maulgraph)
// ============================================================

/** .maulgraph file format */
export interface MaulGraphFile {
  version: string
  metadata: {
    name: string
    description: string
    author: string
    createdAt: string
    updatedAt: string
    tags: string[]
  }
  nodes: GraphNode[]
  connections: GraphConnection[]
  variables: GraphVariable[]
  settings: GraphSettings
}

// ============================================================
// EDITOR STATE TYPES
// ============================================================

/** Editor mode */
export type EditorMode = 'select' | 'connect' | 'pan' | 'zoom'

/** Viewport state */
export interface EditorViewport {
  x: number
  y: number
  zoom: number
}

/** Selection state */
export interface EditorSelection {
  nodeIds: string[]
  connectionIds: string[]
}

/** Graph editor state */
export interface GraphEditorState {
  graph: AutomationGraph | null
  selectedNodeIds: string[]
  selectedConnectionIds: string[]
  mode: EditorMode
  viewport: EditorViewport
  isDirty: boolean
}

// ============================================================
// DEBUG TYPES
// ============================================================

/** Debug execution info */
export interface DebugExecution {
  executionId: string
  graphId: string
  status: GraphExecutionStatus
  nodeStates: Map<string, NodeState>
  startedAt: number
  logs: DebugLogEntry[]
}

/** Debug log entry */
export interface DebugLogEntry {
  timestamp: number
  level: 'info' | 'warning' | 'error' | 'debug'
  nodeId?: string
  message: string
}

// ============================================================
// NODE COLOR MAP
// ============================================================

/** Colors for node categories */
export const NODE_COLORS: Record<NodeCategory, string> = {
  event: '#10b981',      // green
  condition: '#f59e0b',  // amber
  logic: '#8b5cf6',      // purple
  delay: '#06b6d4',      // cyan
  variable: '#ec4899',   // pink
  action: '#3b82f6'      // blue
}
