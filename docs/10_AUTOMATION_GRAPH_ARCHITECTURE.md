# MAULFINITY — AUTOMATION GRAPH ARCHITECTURE

> Version 1.0 | July 22, 2026
> Status: Architecture Design (No Implementation)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why This Design](#2-why-this-design)
3. [Architecture Overview](#3-architecture-overview)
4. [Graph Engine Core](#4-graph-engine-core)
5. [Node System Design](#5-node-system-design)
6. [Node Types Reference](#6-node-types-reference)
7. [Node Lifecycle](#7-node-lifecycle)
8. [Execution Flow](#8-execution-flow)
9. [Graph Data Format](#9-graph-data-format)
10. [Database Schema](#10-database-schema)
11. [Compatibility Strategy](#11-compatibility-strategy)
12. [Migration Plan](#12-migration-plan)
13. [Visual Node Editor Architecture](#13-visual-node-editor-architecture)
14. [Plugin API for Custom Nodes](#14-plugin-api-for-custom-nodes)
15. [Advantages & Tradeoffs](#15-advantages--tradeoffs)
16. [Future Roadmap](#16-future-roadmap)

---

## 1. Executive Summary

Maulfinity will evolve from a **linear trigger-action system** into a **Visual Automation Platform** powered by the **Automation Graph Engine**.

The Graph Engine processes normalized `MaulfinityEvent` objects from the existing Event Bus, routes them through a directed graph of nodes, and executes actions based on complex branching logic — all without requiring code from the user.

### Key Design Principles

| Principle | Description |
|-----------|-------------|
| **Event-Driven** | Graph execution starts when a `MaulfinityEvent` arrives from the Event Bus |
| **Node-Based** | All logic is represented as nodes with typed inputs/outputs |
| **Dataflow Execution** | Nodes process data and pass results downstream |
| **Stateful** | Variables, counters, and cooldowns persist across events |
| **Backward Compatible** | Existing Trigger Engine continues to work alongside Graph Engine |
| **Plugin-Extensible** | Custom node types can be added via the Plugin API |

---

## 2. Why This Design

### The Problem with Linear Triggers

The current Trigger Engine uses a simple model:

```
Event → Trigger Matcher → Condition Checker → Action Queue → Action Runner
```

This works for basic cases but fails for complex automation:

**Example 1: Random Branching**
```
Gift Lion → 50% → Tank
         → 50% → Helicopter
```
Linear triggers cannot express probabilistic branching.

**Example 2: Conditional Logic with State**
```
Gift Rose → Increment Counter → If Counter == 10 → Spawn Boss → Reset Counter
```
Linear triggers have no concept of persistent state.

**Example 3: Parallel Actions with Different Timing**
```
Gift Galaxy → [Immediate] Sound Effect
            → [Delay 2s]  Overlay Animation
            → [Delay 5s]  OBS Scene Change
```
Linear triggers execute actions sequentially with no timing control.

### Why Automation Graph

| Software | Visual System | Purpose |
|----------|---------------|---------|
| Unreal Engine | Blueprint | Game logic |
| Blender | Node Editor | Material/shader |
| Node-RED | Flow Editor | IoT automation |
| ComfyUI | Node Graph | AI workflows |
| N8N | Workflow Editor | API automation |
| OBS | Scene/Source | Stream layout |

Every complex system converges on **visual node-based workflows** because:
1. Visual representation makes complex logic understandable
2. Nodes are composable and reusable
3. Users can create complexity without writing code
4. Graphs can be exported/imported as files

### Design Decision: Why NOT Replace Trigger Engine

| Approach | Pros | Cons |
|----------|------|------|
| Replace Trigger Engine | Clean codebase | Breaking change, lost investment |
| **Dual Mode (Chosen)** | Backward compatible, gradual migration | Slightly more code |
| Graph-Only | Simpler engine | Forces migration, loses users |

**Decision**: Keep both systems. Simple triggers compile to simple graphs internally. Advanced users access the full graph editor.

---

## 3. Architecture Overview

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CONNECTOR LAYER                          │
│                                                                 │
│  TikTok Connector    YouTube Connector    Custom Connectors     │
│         │                    │                    │              │
│         └────────────────────┼────────────────────┘              │
│                              │                                   │
│                    ┌─────────▼─────────┐                        │
│                    │   Event Adapter   │                        │
│                    │  (Normalize to    │                        │
│                    │  MaulfinityEvent) │                        │
│                    └─────────┬─────────┘                        │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │     EVENT BUS       │
                    │  (Normalized Events)│
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼────────┐ ┌────▼────────────┐ ┌─▼──────────────┐
    │  TRIGGER ENGINE  │ │  GRAPH ENGINE   │ │    LOGGER      │
    │  (Simple Mode)   │ │  (Advanced Mode)│ │  (All Events)  │
    │                  │ │                 │ │                 │
    │  Event → Match   │ │  Event → Graph  │ │  Log every     │
    │  → Condition     │ │  → Nodes →      │ │  event for     │
    │  → Action        │ │  → Actions      │ │  debugging     │
    └─────────┬────────┘ └────┬────────────┘ └─────────────────┘
              │                │
              └────────┬───────┘
                       │
              ┌────────▼────────┐
              │  ACTION ENGINE  │
              │  (Shared)       │
              │                 │
              │  Keyboard       │
              │  OBS            │
              │  Overlay        │
              │  Sound          │
              │  TTS            │
              │  WebSocket      │
              │  Plugin Actions │
              └─────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Consumes | Produces |
|-----------|---------------|----------|----------|
| Event Bus | Routes normalized events | MaulfinityEvent | MaulfinityEvent |
| Trigger Engine | Simple event→action matching | MaulfinityEvent | TriggerAction[] |
| **Graph Engine** | Complex node-based workflows | MaulfinityEvent | Action[] |
| Action Engine | Executes individual actions | Action | Side effects |

### Why Graph Engine and Trigger Engine Coexist

```
┌─────────────────────────────────────────┐
│            EVENT BUS                     │
│         (MaulfinityEvent)               │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
  ┌────▼────┐    ┌─────▼─────┐
  │ Trigger │    │   Graph   │
  │ Engine  │    │  Engine   │
  │ (v0.1+) │    │ (v0.6+)  │
  └────┬────┘    └─────┬─────┘
       │               │
       └───────┬───────┘
               │
         ┌─────▼─────┐
         │  Action   │
         │  Engine   │
         └───────────┘
```

**Trigger Engine** = Simple form-based triggers (v0.1–v0.5)
**Graph Engine** = Visual node-based workflows (v0.6+)

Both feed into the same Action Engine. The user chooses which mode to use.

---

## 4. Graph Engine Core

### 4.1 GraphEngine Class

The GraphEngine is the central orchestrator for graph-based automation.

```
GraphEngine
├── GraphRegistry          (loaded graphs)
├── NodeRegistry           (available node types)
├── ExecutionContext       (per-execution state)
├── VariableStore          (persistent variables)
├── GraphExecutor          (runs graphs)
└── EventBus integration   (listens for events)
```

### 4.2 Core Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Event Reception** | Listen to Event Bus for `MaulfinityEvent` |
| **Graph Matching** | Find graphs that have Event Nodes matching the event type |
| **Execution Orchestration** | Start execution contexts and traverse graphs |
| **State Management** | Manage variables, counters, cooldowns across executions |
| **Error Handling** | Log errors, skip failed nodes, continue execution |
| **Lifecycle Management** | Load, save, enable, disable graphs |

### 4.3 GraphEngine Interface

```typescript
interface IGraphEngine {
  // Lifecycle
  initialize(): Promise<void>
  shutdown(): Promise<void>

  // Graph Management
  loadGraph(graph: AutomationGraph): void
  unloadGraph(graphId: string): void
  enableGraph(graphId: string): void
  disableGraph(graphId: string): void

  // Execution
  executeGraph(graphId: string, triggerEvent: MaulfinityEvent): Promise<void>
  abortExecution(executionId: string): void

  // State
  getVariable(name: string): unknown
  setVariable(name: string, value: unknown): void
  getCounter(name: string): number
  incrementCounter(name: string): number
  resetCounter(name: string): void

  // Queries
  getLoadedGraphs(): AutomationGraph[]
  getExecutionStatus(executionId: string): ExecutionStatus
}
```

---

## 5. Node System Design

### 5.1 Node Interface

Every node in the graph implements this interface:

```typescript
interface IGraphNode {
  // Identity
  readonly type: string
  readonly category: NodeCategory

  // Execution
  execute(context: NodeContext): Promise<NodeOutput>

  // Validation
  validate(config: Record<string, unknown>): boolean

  // UI (for visual editor)
  getInputs(): NodePortDefinition[]
  getOutputs(): NodePortDefinition[]
  getConfigSchema(): ConfigSchema
}

interface NodeContext {
  event: MaulfinityEvent        // The triggering event
  variables: VariableStore      // Access to variables
  counters: CounterStore        // Access to counters
  cooldowns: CooldownStore     // Access to cooldowns
  logger: Logger                // Node-specific logger
  graphId: string               // Which graph is running
  executionId: string           // Unique execution ID
  parentNodeId: string | null   // Parent node (for sub-graphs)
}

interface NodeOutput {
  signal: string                // Which output port to activate
  data: Record<string, unknown> // Data passed to next node
}
```

### 5.2 Node Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Event** | Receive external events | Gift, Comment, Follow |
| **Condition** | Evaluate boolean logic | GiftName, Username, Random |
| **Logic** | Combine conditions | AND, OR, NOT, Switch |
| **Delay** | Timing control | Wait, Timer |
| **State** | Persistent data | Variable, Counter |
| **Flow** | Execution control | Cooldown, Throttle |
| **Action** | Produce side effects | Keyboard, OBS, Sound |
| **Utility** | Helper operations | Log, Transform, Format |

### 5.3 Node Port System

Nodes communicate through typed ports:

```typescript
interface NodePortDefinition {
  name: string
  type: 'event' | 'signal' | 'data' | 'any'
  required: boolean
  default?: unknown
}

// Example: Condition Node ports
// Inputs:  event (event), condition (data)
// Outputs: true (signal), false (signal)
```

### 5.4 Node Registration

New node types are registered with the NodeRegistry:

```typescript
interface NodeRegistry {
  register(definition: NodeDefinition): void
  unregister(type: string): void
  get(type: string): NodeDefinition | undefined
  getByCategory(category: NodeCategory): NodeDefinition[]
  getAll(): NodeDefinition[]
}

interface NodeDefinition {
  type: string
  category: NodeCategory
  name: string
  description: string
  icon: string
  factory: () => IGraphNode
  configSchema: ConfigSchema
  inputs: NodePortDefinition[]
  outputs: NodePortDefinition[]
}
```

---

## 6. Node Types Reference

### 6.1 Event Nodes (Input)

Event nodes are entry points. They receive `MaulfinityEvent` from the Event Bus and emit a signal.

| Node | Event Type | Payload Fields |
|------|------------|----------------|
| **Gift** | `gift` | `name`, `count`, `diamonds` |
| **Comment** | `comment` | `text` |
| **Follow** | `follow` | (none) |
| **Join** | `join` | (none) |
| **Like** | `like` | (none) |
| **SuperChat** | `superchat` | `amount`, `currency`, `message` |
| **Membership** | `membership` | `tier` |
| **Custom Event** | any | (user-defined) |

**Execution Behavior:**
1. Event arrives from Event Bus
2. GraphEngine finds Event Nodes matching `event.type`
3. Event Node emits signal with event data
4. Connected nodes begin execution

### 6.2 Condition Nodes

Condition nodes evaluate a boolean condition and route execution.

| Node | Inputs | Outputs | Config |
|------|--------|---------|--------|
| **GiftName** | event | true, false | `name: string` |
| **CoinValue** | event | true, false | `operator: >,<,=,>=,<=`, `value: number` |
| **Username** | event | true, false | `username: string`, `match: exact,contains,regex` |
| **ViewerCount** | event | true, false | `operator: >,<,=,>=,<=`, `value: number` |
| **Random** | signal | out1, out2 | `probability: number` (0-100) |
| **Cooldown** | signal | ready, waiting | `seconds: number` |
| **Platform** | event | true, false | `platform: tiktok,youtube,custom` |
| **CommentContains** | event | true, false | `keyword: string`, `caseSensitive: boolean` |

**Example: Random Node**
```
Input: signal
Config: probability = 30%

Output: 30% → out1 (true branch)
        70% → out2 (false branch)
```

### 6.3 Logic Nodes

Logic nodes combine multiple boolean inputs.

| Node | Inputs | Output | Description |
|------|--------|--------|-------------|
| **AND** | in1, in2, ...inN | out | True only if ALL inputs true |
| **OR** | in1, in2, ...inN | out | True if ANY input true |
| **NOT** | in | out | Inverts boolean |
| **Switch** | in, value | out1, out2, ...outN | Routes based on value |
| **Branch** | condition | true, false | Classic if/else |
| **Gate** | in, enable | out | Passes signal only if enabled |

**Example: Switch Node**
```
Input: event.user
Config: cases = ["vip1", "vip2", "vip3"]

Output: "vip1" → case_vip1
        "vip2" → case_vip2
        "vip3" → case_vip3
        default → case_default
```

### 6.4 Delay Nodes

Delay nodes control timing.

| Node | Input | Output | Config |
|------|-------|--------|--------|
| **Wait** | signal | signal | `seconds: number` |
| **Timer** | start, stop | elapsed, timeout | `duration: number` |
| **Throttle** | signal | signal | `minInterval: number` (seconds) |
| **Debounce** | signal | signal | `delay: number` (seconds) |

**Execution Behavior:**
- `Wait` node holds the signal for the specified duration, then passes it
- `Timer` starts on one input, stops on another, outputs on timeout
- `Throttle` ensures minimum time between executions

### 6.5 State Nodes (Variable & Counter)

State nodes manage persistent data across events.

| Node | Input | Output | Config |
|------|-------|--------|--------|
| **SetVariable** | signal | signal | `name: string`, `value: any` |
| **GetVariable** | signal | value | `name: string` |
| **Increment** | signal | signal, newValue | `counter: string`, `amount: number` |
| **Decrement** | signal | signal, newValue | `counter: string`, `amount: number` |
| **ResetCounter** | signal | signal | `counter: string` |
| **CompareVariable** | signal | true, false | `name: string`, `operator: ==,!=,>,<`, `value: any` |

**Persistence:**
- Variables and counters are stored in the database
- They persist across application restarts
- They are scoped to a profile (not global)

**Example: Counter Logic**
```
Gift Rose → Increment (counter: "rose_count", amount: 1)
                │
                ▼
        CompareVariable (name: "rose_count", operator: ">=", value: 10)
                │
        ┌───────┴───────┐
      true            false
        │               │
   Spawn Boss      (nothing)
        │
   ResetCounter (counter: "rose_count")
```

### 6.6 Flow Control Nodes

| Node | Description |
|------|-------------|
| **Cooldown** | Prevents re-execution for N seconds |
| **RateLimit** | Limits to N executions per minute |
| **Once** | Executes only on first trigger, then disables |
| **Loop** | Repeats N times with delay between iterations |
| **ForEach** | Iterates over a list of items |

### 6.7 Action Nodes (Output)

Action nodes produce side effects by calling the Action Engine.

| Node | Config | Description |
|------|--------|-------------|
| **Keyboard** | `key: string`, `modifiers: string[]` | Simulate keypress |
| **OBS** | `command: string`, `params: object` | Control OBS Studio |
| **Overlay** | `overlayId: string`, `animation: string` | Show overlay |
| **Sound** | `file: string`, `volume: number` | Play audio |
| **TTS** | `text: string`, `voice: string` | Text-to-speech |
| **WebSocket** | `url: string`, `data: object` | Send to external service |
| **PluginAction** | `pluginId: string`, `action: string`, `params: object` | Run plugin action |
| **HTTP** | `method: string`, `url: string`, `headers: object`, `body: object` | HTTP request |
| **Discord** | `webhook: string`, `message: string` | Discord webhook |
| **GameInput** | `game: string`, `action: string`, `params: object` | Game automation |

---

## 7. Node Lifecycle

### 7.1 Node States

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ CREATED  │────▶│  READY   │────▶│ RUNNING  │
└──────────┘     └──────────┘     └──────────┘
                       │                │
                       │                ▼
                       │          ┌──────────┐
                       │          │ COMPLETED│
                       │          └──────────┘
                       │                │
                       ▼                │
                 ┌──────────┐           │
                 │  ERROR   │◀──────────┘
                 └──────────┘
```

### 7.2 Lifecycle Methods

```typescript
interface IGraphNode {
  // Called when node is added to graph
  onCreate?(context: NodeContext): Promise<void>

  // Called when graph starts execution
  onActivate?(context: NodeContext): Promise<void>

  // Called when node receives input signal
  execute(context: NodeContext): Promise<NodeOutput>

  // Called when execution completes (success or error)
  onDeactivate?(context: NodeContext): Promise<void>

  // Called when node is removed from graph
  onDestroy?(): Promise<void>
}
```

### 7.3 Node Error Handling

```typescript
interface NodeExecutionResult {
  success: boolean
  output?: NodeOutput
  error?: {
    code: string
    message: string
    nodeId: string
  }
  duration: number  // ms
}
```

**Error Handling Rules:**
1. Failed nodes log errors but don't crash the graph
2. Failed nodes don't emit output signals (downstream nodes don't execute)
3. Critical nodes can be marked as `required: true` to halt graph on failure
4. Error count is tracked per node for debugging

---

## 8. Execution Flow

### 8.1 Complete Execution Pipeline

```
1. EVENT ARRIVES
   │
   │  MaulfinityEvent from Event Bus
   │
   ▼
2. GRAPH MATCHING
   │
   │  For each loaded graph:
   │    Find Event Nodes where node.eventType == event.type
   │
   ▼
3. EXECUTION CONTEXT CREATION
   │
   │  Create ExecutionContext:
   │    - event (the MaulfinityEvent)
   │    - variables (from VariableStore)
   │    - counters (from CounterStore)
   │    - executionId (unique)
   │    - timestamp
   │
   ▼
4. NODE EXECUTION (starting from Event Nodes)
   │
   │  Execute matched Event Node
   │    → emits signal with event data
   │
   ▼
5. SIGNAL PROPAGATION
   │
   │  Follow connections from Event Node output
   │  Execute connected nodes in order:
   │    - Condition nodes: evaluate, route to true/false
   │    - Logic nodes: combine boolean results
   │    - Delay nodes: hold signal, then pass
   │    - State nodes: read/write variables
   │    - Action nodes: execute side effects
   │
   ▼
6. PARALLEL BRANCHES
   │
   │  If a node has multiple output connections:
   │    Execute each branch in parallel
   │    Each branch has its own execution path
   │
   ▼
7. TERMINATION
   │
   │  Graph execution completes when:
   │    - All active branches reach Action Nodes (no further connections)
   │    - All Delay nodes complete
   │    - No more signals to propagate
   │
   ▼
8. CLEANUP
   │
   │  - Log execution summary
   │  - Update statistics
   │  - Persist any state changes
   │  - Release ExecutionContext
```

### 8.2 Execution Rules

| Rule | Description |
|------|-------------|
| **Deterministic Ordering** | Linear connections execute in order (top to bottom) |
| **Parallel Branches** | Multiple outputs from one node execute simultaneously |
| **State Consistency** | Variables are snapshot at execution start, committed at end |
| **Cooldown Isolation** | Each graph has independent cooldown state |
| **Error Isolation** | One graph's failure doesn't affect other graphs |
| **Maximum Depth** | Execution depth limited to 100 nodes (prevents infinite loops) |
| **Maximum Duration** | Single execution limited to 30 seconds |
| **Maximum Parallel** | Maximum 10 parallel executions per graph |

### 8.3 Execution Context

```typescript
interface ExecutionContext {
  executionId: string
  graphId: string
  triggerEvent: MaulfinityEvent
  startedAt: number
  variables: Map<string, unknown>
  counters: Map<string, number>
  cooldowns: Map<string, number>
  nodeStates: Map<string, NodeState>
  depth: number
  parallelCount: number
  aborted: boolean
}
```

---

## 9. Graph Data Format

### 9.1 JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Maulfinity Automation Graph",
  "type": "object",
  "required": ["id", "name", "version", "nodes", "connections"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique graph identifier (UUID)"
    },
    "name": {
      "type": "string",
      "description": "Human-readable graph name"
    },
    "description": {
      "type": "string",
      "description": "Graph description"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Semantic version"
    },
    "author": {
      "type": "string",
      "description": "Author name"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Searchable tags"
    },
    "nodes": {
      "type": "array",
      "items": { "$ref": "#/definitions/GraphNode" }
    },
    "connections": {
      "type": "array",
      "items": { "$ref": "#/definitions/GraphConnection" }
    },
    "variables": {
      "type": "array",
      "items": { "$ref": "#/definitions/GraphVariable" }
    },
    "settings": {
      "type": "object",
      "description": "Graph-level settings"
    },
    "metadata": {
      "type": "object",
      "description": "Export metadata"
    }
  }
}
```

### 9.2 Node Definition

```json
{
  "id": "node_gift_001",
  "type": "event:gift",
  "position": { "x": 100, "y": 200 },
  "config": {
    "eventType": "gift"
  },
  "disabled": false
}
```

### 9.3 Connection Definition

```json
{
  "id": "conn_001",
  "from": {
    "nodeId": "node_gift_001",
    "port": "output"
  },
  "to": {
    "nodeId": "node_random_001",
    "port": "input"
  }
}
```

### 9.4 Variable Definition

```json
{
  "name": "rose_count",
  "type": "number",
  "defaultValue": 0,
  "description": "Count of Rose gifts received"
}
```

### 9.5 Complete Example: Zombie Chaos Graph

```json
{
  "id": "graph_zombie_chaos_001",
  "name": "Zombie Chaos",
  "description": "Gift-triggered zombie apocalypse with random events",
  "version": "1.0.0",
  "author": "Maulfinity",
  "tags": ["zombie", "chaos", "gift"],
  "nodes": [
    {
      "id": "evt_gift",
      "type": "event:gift",
      "position": { "x": 100, "y": 300 },
      "config": { "eventType": "gift" }
    },
    {
      "id": "cond_is_lion",
      "type": "condition:giftname",
      "position": { "x": 300, "y": 300 },
      "config": { "name": "Lion" }
    },
    {
      "id": "logic_random",
      "type": "logic:random",
      "position": { "x": 500, "y": 300 },
      "config": { "probability": 50 }
    },
    {
      "id": "action_tank",
      "type": "action:plugin",
      "position": { "x": 700, "y": 200 },
      "config": {
        "pluginId": "game-spawner",
        "action": "spawn",
        "params": { "entity": "tank" }
      }
    },
    {
      "id": "action_zombie",
      "type": "action:plugin",
      "position": { "x": 700, "y": 400 },
      "config": {
        "pluginId": "game-spawner",
        "action": "spawn",
        "params": { "entity": "zombie" }
      }
    },
    {
      "id": "action_obs",
      "type": "action:obs",
      "position": { "x": 900, "y": 300 },
      "config": {
        "command": "switchScene",
        "params": { "scene": "Chaos Mode" }
      }
    },
    {
      "id": "action_sound",
      "type": "action:sound",
      "position": { "x": 900, "y": 450 },
      "config": {
        "file": "explosion.mp3",
        "volume": 0.8
      }
    }
  ],
  "connections": [
    { "id": "c1", "from": { "nodeId": "evt_gift", "port": "output" }, "to": { "nodeId": "cond_is_lion", "port": "input" } },
    { "id": "c2", "from": { "nodeId": "cond_is_lion", "port": "true" }, "to": { "nodeId": "logic_random", "port": "input" } },
    { "id": "c3", "from": { "nodeId": "logic_random", "port": "out1" }, "to": { "nodeId": "action_tank", "port": "input" } },
    { "id": "c4", "from": { "nodeId": "logic_random", "port": "out2" }, "to": { "nodeId": "action_zombie", "port": "input" } },
    { "id": "c5", "from": { "nodeId": "action_tank", "port": "signal" }, "to": { "nodeId": "action_obs", "port": "input" } },
    { "id": "c6", "from": { "nodeId": "action_zombie", "port": "signal" }, "to": { "nodeId": "action_obs", "port": "input" } },
    { "id": "c7", "from": { "nodeId": "action_obs", "port": "signal" }, "to": { "nodeId": "action_sound", "port": "input" } }
  ],
  "variables": [],
  "settings": {
    "maxExecutionDepth": 100,
    "maxParallelExecutions": 5,
    "executionTimeout": 30000
  }
}
```

### 9.6 Visual Representation

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Gift Event │────▶│ Is Lion?    │────▶│  Random 50% │
│  (evt_gift) │     │(cond_is_lion)│    │(logic_random)│
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                              ┌─────────────────┼─────────────────┐
                              │                                   │
                              ▼                                   ▼
                    ┌─────────────┐                     ┌─────────────┐
                    │  Spawn Tank │                     │ Spawn Zombie│
                    │(action_tank)│                     │(action_zombie)│
                    └──────┬──────┘                     └──────┬──────┘
                           │                                   │
                           └─────────────┬─────────────────────┘
                                         │
                                         ▼
                               ┌─────────────┐
                               │  OBS Scene  │
                               │ (action_obs)│
                               └──────┬──────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │   Sound     │
                               │(action_sound)│
                               └─────────────┘
```

---

## 10. Database Schema

### 10.1 Graphs Table

```sql
CREATE TABLE automation_graphs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  author TEXT,
  tags TEXT, -- JSON array
  graph_data TEXT NOT NULL, -- Full JSON graph
  profile_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);
```

### 10.2 Graph Variables Table

```sql
CREATE TABLE graph_variables (
  id TEXT PRIMARY KEY,
  graph_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'number',
  value TEXT NOT NULL, -- JSON encoded
  profile_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (graph_id) REFERENCES automation_graphs(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  UNIQUE(graph_id, name)
);
```

### 10.3 Graph Execution History

```sql
CREATE TABLE graph_executions (
  id TEXT PRIMARY KEY,
  graph_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed, aborted
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  duration_ms INTEGER,
  nodes_executed INTEGER DEFAULT 0,
  error_message TEXT,
  FOREIGN KEY (graph_id) REFERENCES automation_graphs(id) ON DELETE CASCADE
);
```

### 10.4 Node Execution Log

```sql
CREATE TABLE node_executions (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed, skipped
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  duration_ms INTEGER,
  input_data TEXT, -- JSON
  output_data TEXT, -- JSON
  error_message TEXT,
  FOREIGN KEY (execution_id) REFERENCES graph_executions(id) ON DELETE CASCADE
);
```

### 10.5 Migration from Existing Triggers

The existing `triggers` table remains unchanged. Graph Engine reads from `automation_graphs` table. Both systems can coexist.

```sql
-- Existing triggers table (unchanged)
CREATE TABLE triggers (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  condition TEXT NOT NULL, -- JSON
  actions TEXT NOT NULL, -- JSON
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);
```

---

## 11. Compatibility Strategy

### 11.1 Dual Mode Operation

```
┌─────────────────────────────────────────────────┐
│                 USER INTERFACE                    │
│                                                  │
│  ┌──────────────────┐  ┌──────────────────┐     │
│  │  Simple Trigger  │  │  Advanced Graph  │     │
│  │  Builder (v0.1+) │  │  Editor (v0.8+)  │     │
│  │                  │  │                  │     │
│  │  Form-based UI   │  │  Visual nodes    │     │
│  │  Event dropdown  │  │  Drag & drop     │     │
│  │  Condition fields│  │  Connection lines│     │
│  │  Action list     │  │  Real-time preview│    │
│  └────────┬─────────┘  └────────┬─────────┘     │
│           │                     │                │
│           ▼                     ▼                │
│  ┌──────────────────┐  ┌──────────────────┐     │
│  │  Trigger Engine  │  │   Graph Engine   │     │
│  │  (linear match)  │  │  (node execution)│     │
│  └────────┬─────────┘  └────────┬─────────┘     │
│           │                     │                │
│           └─────────┬───────────┘                │
│                     │                            │
│                     ▼                            │
│            ┌─────────────────┐                   │
│            │  Action Engine  │                   │
│            │  (shared)       │                   │
│            └─────────────────┘                   │
└─────────────────────────────────────────────────┘
```

### 11.2 Trigger-to-Graph Compilation

Simple triggers can be automatically compiled to minimal graphs:

```
Simple Trigger:
  Event: gift
  Condition: name == "Lion"
  Action: keyboard("F10")

Compiled Graph:
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │Gift Event│───▶│GiftName  │───▶│Keyboard  │
  └──────────┘    │(Lion)    │    │(F10)     │
                  └──────────┘    └──────────┘
```

This allows:
1. Existing triggers to work with Graph Engine (performance optimization)
2. Users to upgrade from simple to advanced mode seamlessly
3. Both UIs (form and visual) to work with the same backend

### 11.3 API Compatibility

```typescript
// Existing Trigger API (unchanged)
interface TriggerAPI {
  create(trigger: Trigger): Promise<Trigger>
  update(id: string, trigger: Partial<Trigger>): Promise<Trigger>
  delete(id: string): Promise<void>
  list(): Promise<Trigger[]>
  toggle(id: string, enabled: boolean): Promise<void>
}

// New Graph API
interface GraphAPI {
  create(graph: AutomationGraph): Promise<AutomationGraph>
  update(id: string, graph: Partial<AutomationGraph>): Promise<AutomationGraph>
  delete(id: string): Promise<void>
  list(): Promise<AutomationGraph[]>
  toggle(id: string, enabled: boolean): Promise<void>
  export(id: string): Promise<GraphExport>
  import(data: GraphExport): Promise<AutomationGraph>
  compile(trigger: Trigger): Promise<AutomationGraph>
}
```

---

## 12. Migration Plan

### 12.1 Phase Overview

| Phase | Version | Timeline | Description |
|-------|---------|----------|-------------|
| **Phase 1** | v0.1–v0.5 | Current | Form-based Trigger Builder only |
| **Phase 2** | v0.6 | Sprint 3–4 | Graph Engine backend + simple UI |
| **Phase 3** | v0.7 | Sprint 5–6 | Graph Editor (read-only view) |
| **Phase 4** | v0.8 | Sprint 7–8 | Visual Node Editor (drag & drop) |
| **Phase 5** | v1.0 | Launch | Full platform with Marketplace |

### 12.2 Phase 1: Trigger Builder (Current)

```
Status: IN PROGRESS

Features:
├── Form-based trigger creation
├── Event type selection
├── Condition fields
├── Action list
└── Enable/disable toggle

Engine:
└── TriggerEngine (linear matching)
```

### 12.3 Phase 2: Graph Engine Backend

```
Status: PLANNED (Sprint 3–4)

Features:
├── GraphEngine class
├── Node registry (built-in nodes)
├── Graph execution
├── Variable/counter storage
├── Graph CRUD API
└── Trigger-to-graph compiler

Engine:
├── TriggerEngine (unchanged)
└── GraphEngine (new)
```

### 12.4 Phase 3: Graph View

```
Status: PLANNED (Sprint 5–6)

Features:
├── Read-only graph visualization
├── Execution flow highlighting
├── Error indication
└── Export/import graphs
```

### 12.5 Phase 4: Visual Node Editor

```
Status: PLANNED (Sprint 7–8)

Features:
├── Drag & drop node placement
├── Connection drawing
├── Node configuration panels
├── Real-time preview
├── Undo/redo
├── Copy/paste nodes
└── Auto-layout
```

### 12.6 Phase 5: Full Platform

```
Status: PLANNED (v1.0)

Features:
├── Marketplace integration
├── Graph templates
├── AI-assisted graph creation
├── Collaborative editing
└── Plugin SDK for custom nodes
```

---

## 13. Visual Node Editor Architecture

### 13.1 Editor Components

```
┌─────────────────────────────────────────────────────────────┐
│                    GRAPH EDITOR UI                           │
│                                                              │
│  ┌──────────┐  ┌──────────────────────────┐  ┌──────────┐  │
│  │  Node    │  │                          │  │  Node    │  │
│  │  Palette │  │     Canvas (SVG/WebGL)   │  │  Config  │  │
│  │          │  │                          │  │  Panel   │  │
│  │ Events   │  │   ┌────┐   ┌────┐       │  │          │  │
│  │ Conditions│ │   │Node│──▶│Node│──▶...  │  │  [name]  │  │
│  │ Logic    │  │   └────┘   └────┘       │  │  [type]  │  │
│  │ Actions  │  │                          │  │  [config]│  │
│  │          │  │                          │  │          │  │
│  └──────────┘  └──────────────────────────┘  └──────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Toolbar                               │ │
│  │  [Save] [Load] [Export] [Import] [Run] [Debug] [Settings]│ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 13.2 Rendering Technology

| Technology | Use Case | Reason |
|------------|----------|--------|
| **SVG** | Node rendering, connections | DOM-based, easy styling |
| **Canvas/WebGL** | Large graphs (>100 nodes) | Better performance |
| **React** | UI panels, controls | Existing tech stack |
| **D3.js** | Graph layout algorithms | Proven library |
| **Zustand** | Editor state management | Lightweight, TypeScript |

### 13.3 Editor State Management

```typescript
interface GraphEditorState {
  // Graph data
  graph: AutomationGraph | null
  selectedNodeId: string | null
  selectedConnectionId: string | null

  // Editor mode
  mode: 'select' | 'connect' | 'pan' | 'zoom'

  // Viewport
  viewport: {
    x: number
    y: number
    zoom: number
  }

  // History (for undo/redo)
  history: GraphSnapshot[]
  historyIndex: number

  // Clipboard
  clipboard: GraphNode[]

  // Actions
  addNode(type: string, position: { x: number; y: number }): void
  removeNode(nodeId: string): void
  moveNode(nodeId: string, position: { x: number; y: number }): void
  updateNodeConfig(nodeId: string, config: Record<string, unknown>): void
  connect(from: NodePort, to: NodePort): void
  disconnect(connectionId: string): void
  undo(): void
  redo(): void
  save(): void
  load(graphId: string): void
}
```

### 13.4 Node Rendering

```typescript
interface NodeRenderer {
  render(node: GraphNode, state: NodeState): JSX.Element
  renderPorts(ports: NodePortDefinition[]): JSX.Element
  renderConfig(node: GraphNode): JSX.Element
}

// Each node type has a custom renderer
const nodeRenderers: Map<string, NodeRenderer> = new Map()
```

### 13.5 Connection Rendering

Connections are rendered as SVG paths (Bezier curves):

```typescript
interface ConnectionRenderer {
  renderPath(from: Point, to: Point): string  // SVG path d attribute
  renderLabel(text: string): JSX.Element
  highlight(connection: GraphConnection): void
  animateFlow(connection: GraphConnection): void
}
```

---

## 14. Plugin API for Custom Nodes

### 14.1 Plugin Node Interface

Plugins can define custom node types:

```typescript
interface PluginNodeDefinition {
  // Identity
  type: string
  name: string
  description: string
  category: NodeCategory
  icon: string

  // Configuration
  configSchema: ConfigSchema

  // Ports
  inputs: NodePortDefinition[]
  outputs: NodePortDefinition[]

  // Factory
  create(): IGraphNode
}
```

### 14.2 Plugin Registration

```typescript
// In plugin main.ts
import { GraphEngine } from '@core/graph-engine'

export function activate(graphEngine: GraphEngine) {
  // Register custom node
  graphEngine.registerNode({
    type: 'plugin:my-custom-node',
    name: 'My Custom Node',
    description: 'Does something cool',
    category: 'action',
    icon: '🎯',
    configSchema: {
      message: { type: 'string', required: true },
      delay: { type: 'number', default: 0 }
    },
    inputs: [
      { name: 'input', type: 'signal', required: true }
    ],
    outputs: [
      { name: 'output', type: 'signal' }
    ],
    create: () => new MyCustomNode()
  })
}

export function deactivate(graphEngine: GraphEngine) {
  graphEngine.unregisterNode('plugin:my-custom-node')
}
```

### 14.3 Custom Node Implementation

```typescript
class MyCustomNode implements IGraphNode {
  readonly type = 'plugin:my-custom-node'
  readonly category: NodeCategory = 'action'

  async execute(context: NodeContext): Promise<NodeOutput> {
    const { message, delay } = context.config

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay * 1000))
    }

    context.logger.info(`Custom node executed: ${message}`)

    return {
      signal: 'output',
      data: { message }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return typeof config.message === 'string' && config.message.length > 0
  }

  getInputs(): NodePortDefinition[] {
    return [{ name: 'input', type: 'signal', required: true }]
  }

  getOutputs(): NodePortDefinition[] {
    return [{ name: 'output', type: 'signal' }]
  }

  getConfigSchema(): ConfigSchema {
    return {
      message: { type: 'string', required: true, label: 'Message' },
      delay: { type: 'number', default: 0, min: 0, max: 60, label: 'Delay (seconds)' }
    }
  }
}
```

### 14.4 Plugin Permissions

Plugins must declare permissions for custom nodes:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "permissions": [
    "graph-engine:register-node",
    "graph-engine:execute-node",
    "action-engine:register-action"
  ]
}
```

---

## 15. Advantages & Tradeoffs

### 15.1 Advantages

| Advantage | Description |
|-----------|-------------|
| **Unlimited Complexity** | No limit on branching, conditions, or actions |
| **Visual Understanding** | Complex logic is visible and understandable |
| **Reusability** | Graphs can be exported, shared, and imported |
| **State Management** | Built-in variables, counters, cooldowns |
| **Parallel Execution** | Multiple branches execute simultaneously |
| **Error Isolation** | One node's failure doesn't crash the system |
| **Plugin Extensibility** | Custom nodes via Plugin API |
| **Backward Compatible** | Existing triggers continue to work |
| **Marketplace Ready** | Graphs are portable JSON files |
| **AI Ready** | Graphs can be generated from natural language |

### 15.2 Tradeoffs

| Tradeoff | Mitigation |
|----------|------------|
| **Complexity** | Phased rollout (simple → advanced) |
| **Performance** | Graph execution is optimized (no hot loops) |
| **Learning Curve** | Form-based mode for beginners |
| **Memory Usage** | Graphs are loaded on-demand |
| **Debugging Difficulty** | Execution logging + visual debug mode |
| **File Size** | Graphs are compact JSON |

### 15.3 Performance Considerations

| Metric | Target | Notes |
|--------|--------|-------|
| Graph Load Time | < 100ms | From database |
| Node Execution | < 10ms | Per node |
| Full Graph Execution | < 500ms | For typical graphs |
| Memory per Graph | < 1MB | Including state |
| Max Nodes per Graph | 1000 | Hard limit |
| Max Connections | 5000 | Hard limit |
| Parallel Executions | 10 | Per graph |

---

## 16. Future Roadmap

### 16.1 Short Term (v0.6–v0.7)

- [ ] GraphEngine core implementation
- [ ] Built-in node types (Event, Condition, Logic, Delay, State, Action)
- [ ] Graph CRUD API
- [ ] Simple graph visualization
- [ ] Trigger-to-graph compiler

### 16.2 Medium Term (v0.8–v0.9)

- [ ] Visual Node Editor
- [ ] Drag & drop node placement
- [ ] Connection drawing
- [ ] Node configuration panels
- [ ] Undo/redo system
- [ ] Graph templates

### 16.3 Long Term (v1.0+)

- [ ] Marketplace integration
- [ ] Graph sharing/export
- [ ] AI-assisted graph creation
- [ ] Collaborative editing
- [ ] Plugin SDK for custom nodes
- [ ] Graph versioning
- [ ] Graph analytics

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Automation Graph** | A visual workflow composed of nodes and connections |
| **Node** | A single processing unit in a graph |
| **Connection** | A link between two nodes' ports |
| **Port** | An input or output point on a node |
| **Signal** | A message that triggers node execution |
| **Execution Context** | State for a single graph execution |
| **Variable** | Persistent key-value storage across events |
| **Counter** | A numeric variable with increment/decrement operations |
| **Cooldown** | Time-based execution limiter |

---

## Appendix B: Node Type Quick Reference

| Category | Node | Purpose |
|----------|------|---------|
| Event | Gift, Comment, Follow, Join, Like, SuperChat, Membership | Entry points |
| Condition | GiftName, CoinValue, Username, ViewerCount, Random, Platform | Boolean evaluation |
| Logic | AND, OR, NOT, Switch, Branch, Gate | Combine conditions |
| Delay | Wait, Timer, Throttle, Debounce | Timing control |
| State | SetVariable, GetVariable, Increment, Decrement, ResetCounter | Persistent data |
| Flow | Cooldown, RateLimit, Once, Loop, ForEach | Execution control |
| Action | Keyboard, OBS, Overlay, Sound, TTS, WebSocket, Plugin, HTTP, Discord | Side effects |
| Utility | Log, Transform, Format, Counter | Helper operations |

---

**End of Automation Graph Architecture Document**
