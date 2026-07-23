import { Logger } from '@services/logger'
import { NodeDefinition, NodeCategory, NodeType } from './types'
import { BaseNode } from './nodes/BaseNode'
import {
  GiftEventNode, CommentEventNode, FollowEventNode,
  JoinEventNode, LikeEventNode, SuperChatEventNode,
  MembershipEventNode, CustomEventNode
} from './nodes/EventNode'
import {
  GiftNameConditionNode, CoinValueConditionNode,
  UsernameConditionNode, RandomConditionNode,
  PlatformConditionNode
} from './nodes/ConditionNode'
import {
  AndNode, OrNode, NotNode, BranchNode,
  SwitchNode, GateNode
} from './nodes/LogicNode'
import {
  SetVariableNode, GetVariableNode, IncrementCounterNode,
  DecrementCounterNode, ResetCounterNode, CompareVariableNode
} from './nodes/VariableNode'
import {
  KeyboardActionNode, OBSActionNode, SoundActionNode,
  TTSActionNode, OverlayActionNode, WebSocketActionNode,
  GameCommandActionNode, DelayActionNode
} from './nodes/ActionNode'

const logger = new Logger('NodeManager')

/**
 * NodeManager - Registry of all available node types
 *
 * Responsibilities:
 * - Register built-in node types
 * - Register plugin node types
 * - Lookup node definitions by type
 * - Get nodes by category
 * - Create node instances
 */
export class NodeManager {
  private static instance: NodeManager
  private nodes: Map<NodeType, NodeDefinition> = new Map()

  private constructor() {
    this.registerBuiltInNodes()
  }

  static getInstance(): NodeManager {
    if (!NodeManager.instance) {
      NodeManager.instance = new NodeManager()
    }
    return NodeManager.instance
  }

  /**
   * Register all built-in node types
   */
  private registerBuiltInNodes(): void {
    // Event Nodes
    this.register({ type: 'event:gift', category: 'event', name: 'Gift', description: 'Triggers on gift', icon: '🎁', color: '#10b981', inputs: [], outputs: [{ name: 'output', type: 'signal', required: false }], configSchema: {}, factory: () => new GiftEventNode() })
    this.register({ type: 'event:comment', category: 'event', name: 'Comment', description: 'Triggers on comment', icon: '💬', color: '#10b981', inputs: [], outputs: [{ name: 'output', type: 'signal', required: false }], configSchema: {}, factory: () => new CommentEventNode() })
    this.register({ type: 'event:follow', category: 'event', name: 'Follow', description: 'Triggers on follow', icon: '👤', color: '#10b981', inputs: [], outputs: [{ name: 'output', type: 'signal', required: false }], configSchema: {}, factory: () => new FollowEventNode() })
    this.register({ type: 'event:join', category: 'event', name: 'Join', description: 'Triggers on join', icon: '👋', color: '#10b981', inputs: [], outputs: [{ name: 'output', type: 'signal', required: false }], configSchema: {}, factory: () => new JoinEventNode() })
    this.register({ type: 'event:like', category: 'event', name: 'Like', description: 'Triggers on like', icon: '❤️', color: '#10b981', inputs: [], outputs: [{ name: 'output', type: 'signal', required: false }], configSchema: {}, factory: () => new LikeEventNode() })
    this.register({ type: 'event:superchat', category: 'event', name: 'Super Chat', description: 'Triggers on super chat', icon: '💰', color: '#10b981', inputs: [], outputs: [{ name: 'output', type: 'signal', required: false }], configSchema: {}, factory: () => new SuperChatEventNode() })
    this.register({ type: 'event:membership', category: 'event', name: 'Membership', description: 'Triggers on membership', icon: '⭐', color: '#10b981', inputs: [], outputs: [{ name: 'output', type: 'signal', required: false }], configSchema: {}, factory: () => new MembershipEventNode() })
    this.register({ type: 'event:custom', category: 'event', name: 'Custom Event', description: 'Triggers on custom event', icon: '⚡', color: '#10b981', inputs: [], outputs: [{ name: 'output', type: 'signal', required: false }], configSchema: {}, factory: () => new CustomEventNode() })

    // Condition Nodes
    this.register({ type: 'condition:giftname', category: 'condition', name: 'Gift Name', description: 'Check gift name', icon: '🎁', color: '#f59e0b', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'true', type: 'signal', required: false }, { name: 'false', type: 'signal', required: false }], configSchema: {}, factory: () => new GiftNameConditionNode() })
    this.register({ type: 'condition:coinvalue', category: 'condition', name: 'Coin Value', description: 'Check numeric value', icon: '🪙', color: '#f59e0b', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'true', type: 'signal', required: false }, { name: 'false', type: 'signal', required: false }], configSchema: {}, factory: () => new CoinValueConditionNode() })
    this.register({ type: 'condition:username', category: 'condition', name: 'Username', description: 'Check username', icon: '👤', color: '#f59e0b', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'true', type: 'signal', required: false }, { name: 'false', type: 'signal', required: false }], configSchema: {}, factory: () => new UsernameConditionNode() })
    this.register({ type: 'condition:random', category: 'condition', name: 'Random', description: 'Random probability', icon: '🎲', color: '#f59e0b', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'true', type: 'signal', required: false }, { name: 'false', type: 'signal', required: false }], configSchema: {}, factory: () => new RandomConditionNode() })
    this.register({ type: 'condition:platform', category: 'condition', name: 'Platform', description: 'Check platform', icon: '📡', color: '#f59e0b', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'true', type: 'signal', required: false }, { name: 'false', type: 'signal', required: false }], configSchema: {}, factory: () => new PlatformConditionNode() })

    // Logic Nodes
    this.register({ type: 'logic:and', category: 'logic', name: 'AND', description: 'All inputs true', icon: '&', color: '#8b5cf6', inputs: [{ name: 'in1', type: 'signal', required: true }, { name: 'in2', type: 'signal', required: true }], outputs: [{ name: 'true', type: 'signal', required: false }, { name: 'false', type: 'signal', required: false }], configSchema: {}, factory: () => new AndNode() })
    this.register({ type: 'logic:or', category: 'logic', name: 'OR', description: 'Any input true', icon: '|', color: '#8b5cf6', inputs: [{ name: 'in1', type: 'signal', required: true }, { name: 'in2', type: 'signal', required: true }], outputs: [{ name: 'true', type: 'signal', required: false }, { name: 'false', type: 'signal', required: false }], configSchema: {}, factory: () => new OrNode() })
    this.register({ type: 'logic:not', category: 'logic', name: 'NOT', description: 'Invert signal', icon: '!', color: '#8b5cf6', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'true', type: 'signal', required: false }, { name: 'false', type: 'signal', required: false }], configSchema: {}, factory: () => new NotNode() })
    this.register({ type: 'logic:branch', category: 'logic', name: 'Branch', description: 'If/else routing', icon: '⑂', color: '#8b5cf6', inputs: [{ name: 'condition', type: 'signal', required: true }], outputs: [{ name: 'true', type: 'signal', required: false }, { name: 'false', type: 'signal', required: false }], configSchema: {}, factory: () => new BranchNode() })
    this.register({ type: 'logic:switch', category: 'logic', name: 'Switch', description: 'Multi-branch', icon: '⊞', color: '#8b5cf6', inputs: [{ name: 'input', type: 'data', required: true }], outputs: [{ name: 'case1', type: 'signal', required: false }, { name: 'case2', type: 'signal', required: false }, { name: 'case3', type: 'signal', required: false }, { name: 'default', type: 'signal', required: false }], configSchema: {}, factory: () => new SwitchNode() })
    this.register({ type: 'logic:gate', category: 'logic', name: 'Gate', description: 'Pass if enabled', icon: '🚧', color: '#8b5cf6', inputs: [{ name: 'input', type: 'signal', required: true }, { name: 'enable', type: 'data', required: false }], outputs: [{ name: 'output', type: 'signal', required: false }], configSchema: {}, factory: () => new GateNode() })

    // Variable Nodes
    this.register({ type: 'variable:set', category: 'variable', name: 'Set Variable', description: 'Set a variable', icon: '📝', color: '#ec4899', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'output', type: 'signal', required: false }], configSchema: {}, factory: () => new SetVariableNode() })
    this.register({ type: 'variable:get', category: 'variable', name: 'Get Variable', description: 'Get a variable', icon: '📖', color: '#ec4899', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'output', type: 'signal', required: false }, { name: 'value', type: 'data', required: false }], configSchema: {}, factory: () => new GetVariableNode() })
    this.register({ type: 'variable:increment', category: 'variable', name: 'Increment Counter', description: 'Increment counter', icon: '➕', color: '#ec4899', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'output', type: 'signal', required: false }, { name: 'newValue', type: 'data', required: false }], configSchema: {}, factory: () => new IncrementCounterNode() })
    this.register({ type: 'variable:decrement', category: 'variable', name: 'Decrement Counter', description: 'Decrement counter', icon: '➖', color: '#ec4899', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'output', type: 'signal', required: false }, { name: 'newValue', type: 'data', required: false }], configSchema: {}, factory: () => new DecrementCounterNode() })
    this.register({ type: 'variable:reset', category: 'variable', name: 'Reset Counter', description: 'Reset counter', icon: '🔄', color: '#ec4899', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'output', type: 'signal', required: false }], configSchema: {}, factory: () => new ResetCounterNode() })
    this.register({ type: 'variable:compare', category: 'variable', name: 'Compare Variable', description: 'Compare variable', icon: '⚖️', color: '#ec4899', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'true', type: 'signal', required: false }, { name: 'false', type: 'signal', required: false }], configSchema: {}, factory: () => new CompareVariableNode() })

    // Action Nodes
    this.register({ type: 'action:keyboard', category: 'action', name: 'Keyboard', description: 'Simulate keypress', icon: '⌨️', color: '#3b82f6', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'signal', type: 'signal', required: false }], configSchema: {}, factory: () => new KeyboardActionNode() })
    this.register({ type: 'action:obs', category: 'action', name: 'OBS', description: 'Control OBS', icon: '📺', color: '#3b82f6', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'signal', type: 'signal', required: false }], configSchema: {}, factory: () => new OBSActionNode() })
    this.register({ type: 'action:sound', category: 'action', name: 'Sound', description: 'Play audio', icon: '🔊', color: '#3b82f6', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'signal', type: 'signal', required: false }], configSchema: {}, factory: () => new SoundActionNode() })
    this.register({ type: 'action:tts', category: 'action', name: 'TTS', description: 'Text-to-speech', icon: '🗣️', color: '#3b82f6', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'signal', type: 'signal', required: false }], configSchema: {}, factory: () => new TTSActionNode() })
    this.register({ type: 'action:overlay', category: 'action', name: 'Overlay', description: 'Show overlay', icon: '🎨', color: '#3b82f6', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'signal', type: 'signal', required: false }], configSchema: {}, factory: () => new OverlayActionNode() })
    this.register({ type: 'action:websocket', category: 'action', name: 'WebSocket', description: 'Send WebSocket data', icon: '🔌', color: '#3b82f6', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'signal', type: 'signal', required: false }], configSchema: {}, factory: () => new WebSocketActionNode() })
    this.register({ type: 'action:game', category: 'action', name: 'Game Command', description: 'Send game command', icon: '🎮', color: '#3b82f6', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'signal', type: 'signal', required: false }], configSchema: {}, factory: () => new GameCommandActionNode() })
    this.register({ type: 'action:delay', category: 'action', name: 'Wait', description: 'Wait duration', icon: '⏱️', color: '#06b6d4', inputs: [{ name: 'input', type: 'signal', required: true }], outputs: [{ name: 'output', type: 'signal', required: false }], configSchema: {}, factory: () => new DelayActionNode() })

    logger.info(`Registered ${this.nodes.size} built-in nodes`)
  }

  /** Register a node definition */
  register(definition: NodeDefinition): void {
    this.nodes.set(definition.type, definition)
  }

  /** Unregister a node type */
  unregister(type: NodeType): void {
    this.nodes.delete(type)
  }

  /** Get a node definition by type */
  get(type: NodeType): NodeDefinition | undefined {
    return this.nodes.get(type)
  }

  /** Get all node definitions */
  getAll(): NodeDefinition[] {
    return Array.from(this.nodes.values())
  }

  /** Get nodes by category */
  getByCategory(category: NodeCategory): NodeDefinition[] {
    return this.getAll().filter(n => n.category === category)
  }

  /** Create a node instance by type */
  createNode(type: NodeType): BaseNode | undefined {
    const def = this.nodes.get(type)
    if (!def) return undefined
    return def.factory()
  }

  /** Get all categories with their nodes */
  getCategories(): Array<{ category: NodeCategory; nodes: NodeDefinition[] }> {
    const categories: NodeCategory[] = ['event', 'condition', 'logic', 'variable', 'action']
    return categories.map(cat => ({
      category: cat,
      nodes: this.getByCategory(cat)
    }))
  }
}
