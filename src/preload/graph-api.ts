import { AutomationGraph, GraphNode, GraphConnection, GraphVariable, GraphSettings } from '../automation/graph/types'

// ============================================================
// GRAPH TYPES (add to existing MaulfinityAPI)
// ============================================================

export interface GraphEditorAPI {
  list: () => Promise<{ success: boolean; data: AutomationGraph[] }>
  get: (graphId: string) => Promise<{ success: boolean; data?: AutomationGraph; error?: string }>
  new: (data: { name: string; description?: string }) => Promise<{ success: boolean; data?: AutomationGraph; error?: string }>
  save: (graph: AutomationGraph) => Promise<{ success: boolean; data?: AutomationGraph; error?: string }>
  delete: (graphId: string) => Promise<{ success: boolean; error?: string }>
  toggle: (graphId: string) => Promise<{ success: boolean; data?: AutomationGraph; error?: string }>
  addNode: (graphId: string, node: GraphNode) => Promise<{ success: boolean; data?: GraphNode; error?: string }>
  updateNode: (graphId: string, nodeId: string, updates: Partial<GraphNode>) => Promise<{ success: boolean; data?: GraphNode; error?: string }>
  removeNode: (graphId: string, nodeId: string) => Promise<{ success: boolean; data?: boolean; error?: string }>
  addConnection: (graphId: string, connection: GraphConnection) => Promise<{ success: boolean; data?: GraphConnection; error?: string }>
  removeConnection: (graphId: string, connectionId: string) => Promise<{ success: boolean; data?: boolean; error?: string }>
  addVariable: (graphId: string, variable: GraphVariable) => Promise<{ success: boolean; error?: string }>
  removeVariable: (graphId: string, name: string) => Promise<{ success: boolean; data?: boolean; error?: string }>
  getNodeTypes: () => Promise<{ success: boolean; data?: unknown[]; error?: string }>
  validate: (graph: AutomationGraph) => Promise<{ success: boolean; data?: { valid: boolean; errors: unknown[]; warnings: unknown[] }; error?: string }>
  execute: (graphId: string, eventData: Record<string, unknown>) => Promise<{ success: boolean; data?: unknown; error?: string }>
  export: (graphId: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
  import: (data: unknown) => Promise<{ success: boolean; data?: AutomationGraph; error?: string }>
  getStats: () => Promise<{ success: boolean; data?: { total: number; enabled: number; totalNodes: number; totalConnections: number }; error?: string }>
}
