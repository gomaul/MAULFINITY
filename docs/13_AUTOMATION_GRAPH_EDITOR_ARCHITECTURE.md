# MAULFINITY — AUTOMATION GRAPH EDITOR ARCHITECTURE

> Version 1.0 | July 23, 2026
> Status: Architecture Design (No Implementation)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Graph Editor Architecture](#3-graph-editor-architecture)
4. [Graph Data Format](#4-graph-data-format)
5. [Node Architecture](#5-node-architecture)
6. [Core Node Types](#6-core-node-types)
7. [Graph Runtime Integration](#7-graph-runtime-integration)
8. [Plugin Compatibility](#8-plugin-compatibility)
9. [Visual Editor Architecture](#9-visual-editor-architecture)
10. [Debug System](#10-debug-system)
11. [Database & Storage Design](#11-database--storage-design)
12. [Migration Strategy](#12-migration-strategy)
13. [Future Roadmap](#13-future-roadmap)

---

## 1. Executive Summary

Maulfinity will evolve into a **Visual Automation Programming Platform** through the Automation Graph Editor.

### Vision

Transform streamer automation from linear triggers into a **node-based visual programming environment** similar to:

| Software | Visual System | Inspiration |
|----------|---------------|-------------|
| Unreal Engine | Blueprint | Game logic |
| Node-RED | Flow Editor | IoT automation |
| Blender | Node Editor | Material/shader |
| ComfyUI | Node Graph | AI workflows |
| N8N | Workflow Editor | API automation |

### Key Design Principles

| Principle | Description |
|-----------|-------------|
| **Editor ≠ Runtime** | Graph Editor creates graphs; Graph Runtime executes them |
| **File-Based** | Graphs are portable `.maulgraph` files |
| **Backward Compatible** | Existing Trigger Engine continues working |
| **Plugin-Extensible** | Custom nodes via Plugin SDK |
| **Stateful Execution** | Variables, counters, cooldowns persist across events |

### Architecture Separation

```
┌─────────────────────────────────────────────────────────────────┐
│                      GRAPH EDITOR                                │
│  (Creates and edits automation graphs)                          │
│                                                                  │
│  Canvas │ Nodes │ Connections │ Inspector │ History              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   .maulgraph      │
                    │   (Graph File)    │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      GRAPH RUNTIME                               │
│  (Executes automation graphs)                                    │
│                                                                  │
│  GraphLoader │ NodeExecutor │ VariableStore │ ActionDispatcher   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   ACTION ENGINE   │
                    │   (Executes)      │
                    └───────────────────┘
```

---

## 2. Architecture Overview

### 2.1 System Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXISTING SYSTEMS (DO NOT MODIFY)              │
│                                                                  │
│  Event Bus │ Trigger Engine │ Action Engine │ Overlay Runtime    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   GRAPH RUNTIME   │ ← Consumes events, executes graphs
                    │   (New Module)    │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   GRAPH EDITOR    │ ← Creates/edits graphs
                    │   (New Module)    │
                    └───────────────────┘
```

### 2.2 Component Responsibilities

| Component | Responsibility | Does NOT |
|-----------|---------------|----------|
| **Graph Editor** | Create, edit, visualize graphs | Execute graphs |
| **Graph Runtime** | Execute graphs, manage state | Create graphs |
| **Node System** | Define node types, lifecycle | Store graphs |
| **Action Engine** | Execute individual actions | Know about graphs |

### 2.3 Data Flow

```
User creates graph in Editor
        │
        ▼
Graph saved as .maulgraph file
        │
        ▼
Graph Runtime loads graph
        │
        ▼
Event Bus sends event to Runtime
        │
        ▼
Runtime finds matching Event Nodes
        │
        ▼
Runtime executes graph traversal
        │
        ▼
Action Nodes call Action Engine
        │
        ▼
Side effects occur (OBS, Sound, etc.)
```

---

## 3. Graph Editor Architecture

### 3.1 Canvas System

The canvas is the main workspace where users visually compose automation workflows.

```
┌─────────────────────────────────────────────────────────────┐
│                    GRAPH CANVAS                              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │    ┌──────┐         ┌──────┐         ┌──────┐      │    │
│  │    │ Node │────────▶│ Node │────────▶│ Node │      │    │
│  │    └──────┘         └──────┘         └──────┘      │    │
│  │                                                      │    │
│  │         ┌──────┐                                     │    │
│  │         │ Node │ (dragging)                          │    │
│  │         └──────┘                                     │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Zoom: 100%   │   Grid: On   │   Snap: On                   │
└─────────────────────────────────────────────────────────────┘
```

**Canvas Features:**

| Feature | Description |
|---------|-------------|
| **Pan** | Click + drag on empty space |
| **Zoom** | Mouse wheel or pinch gesture |
| **Grid** | Optional snap-to-grid |
| **Minimap** | Overview of entire graph |
| **Selection Box** | Multi-select nodes |

### 3.2 Node System (Editor)

Nodes are the building blocks of automation graphs.

```
┌─────────────────────────────┐
│  ⚡ Gift Event              │
├─────────────────────────────┤
│  ● output ──────────────────┤──▶
└─────────────────────────────┘

┌─────────────────────────────┐
│  🔀 Random (50%)            │
├─────────────────────────────┤
│  ◀── input                  │
│  ● true ────────────────────┤──▶
│  ● false ───────────────────┤──▶
└─────────────────────────────┘

┌─────────────────────────────┐
│  🎮 Spawn Vehicle           │
├─────────────────────────────┤
│  ◀── input                  │
│  ○ signal ──────────────────┤──▶
│                             │
│  Model: [adder        ▼]   │
│  Color: [red          ▼]   │
└─────────────────────────────┘
```

**Node Visual Elements:**

| Element | Description |
|---------|-------------|
| **Header** | Icon + name + color coding |
| **Input Ports** | Left side, receive signals/data |
| **Output Ports** | Right side, emit signals/data |
| **Config Panel** | Inline or inspector-based |
| **Status Indicator** | Execution state (idle/running/error) |

### 3.3 Connection System

Connections link node ports together.

```
Connection Types:

Signal Connection (dotted line):
  Node A:output ─ ─ ─ ─ ─ ─ ▶ Node B:input

Data Connection (solid line):
  Node A:value ──────────────▶ Node B:value

Event Connection (thick line):
  Node A:event ═══════════════▶ Node B:event
```

**Connection Rules:**

| Rule | Description |
|------|-------------|
| **Type Matching** | Output port type must match input port type |
| **One Input** | Each input port can have only one connection |
| **Multiple Outputs** | Output ports can have multiple connections |
| **No Self-Connection** | Node cannot connect to itself |
| **No Loops** | Cycles are detected and prevented |

### 3.4 Selection System

```
Selection Modes:

Single Click:
  └── Select one node

Ctrl+Click:
  └── Add/remove from selection

Click + Drag:
  └── Selection box (select multiple)

Ctrl+A:
  └── Select all

Escape:
  └── Deselect all
```

**Selection Actions:**

| Action | Shortcut | Description |
|--------|----------|-------------|
| Delete | Del/Backspace | Remove selected nodes |
| Copy | Ctrl+C | Copy to clipboard |
| Paste | Ctrl+V | Paste from clipboard |
| Duplicate | Ctrl+D | Clone selected |
| Group | Ctrl+G | Create group |

### 3.5 History System (Undo/Redo)

```
History Stack:

┌─────────────────────────────────────────┐
│  Action 1: Add Node "Gift Event"        │
│  Action 2: Add Node "Random"            │
│  Action 3: Connect Gift → Random        │
│  Action 4: Add Node "Spawn Tank"        │
│  Action 5: Connect Random → Tank        │  ← Current
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  Action 6: (future undo)                │
└─────────────────────────────────────────┘

Undo: Ctrl+Z
Redo: Ctrl+Y / Ctrl+Shift+Z
```

**Tracked Operations:**

| Operation | Tracked |
|-----------|---------|
| Add node | ✅ |
| Remove node | ✅ |
| Move node | ✅ |
| Add connection | ✅ |
| Remove connection | ✅ |
| Change config | ✅ |
| Copy/Paste | ✅ |
| Group/Ungroup | ✅ |

### 3.6 Serialization System

Graphs are serialized to/from `.maulgraph` files.

```typescript
interface GraphSerializer {
  // Save graph to file
  serialize(graph: AutomationGraph): string

  // Load graph from file
  deserialize(data: string): AutomationGraph

  // Validate graph before save
  validate(graph: AutomationGraph): ValidationResult

  // Export for marketplace
  exportForMarketplace(graph: AutomationGraph): MarketplaceExport
}
```

---

## 4. Graph Data Format

### 4.1 .maulgraph File Format

The `.maulgraph` file is a JSON document containing the complete graph definition.

```json
{
  "$schema": "https://maulfinity.dev/maulgraph-schema.json",
  
  "id": "graph_zombie_chaos_001",
  "name": "Zombie Chaos",
  "description": "Gift-triggered zombie apocalypse",
  "version": "1.0.0",
  "author": "Maulfinity",
  "createdAt": "2026-07-23T10:00:00Z",
  "updatedAt": "2026-07-23T12:30:00Z",
  
  "nodes": [...],
  "connections": [...],
  "variables": [...],
  "settings": {...},
  "metadata": {...}
}
```

### 4.2 Node Definition

```json
{
  "id": "node_gift_001",
  "type": "event:gift",
  "position": { "x": 100, "y": 200 },
  "size": { "width": 200, "height": 80 },
  "config": {
    "eventType": "gift",
    "giftName": "Lion"
  },
  "disabled": false,
  "collapsed": false,
  "color": null,
  "notes": "Entry point for gift events"
}
```

### 4.3 Connection Definition

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
  },
  "label": "trigger",
  "color": null
}
```

### 4.4 Variable Definition

```json
{
  "name": "rose_count",
  "type": "number",
  "defaultValue": 0,
  "description": "Count of Rose gifts received",
  "scope": "graph"
}
```

### 4.5 Settings Definition

```json
{
  "maxExecutionDepth": 100,
  "maxParallelExecutions": 5,
  "executionTimeout": 30000,
  "enableDebugMode": false,
  "autoLayout": true
}
```

### 4.6 Complete Example

```json
{
  "id": "graph_zombie_chaos_001",
  "name": "Zombie Chaos",
  "description": "Gift-triggered zombie apocalypse with random events",
  "version": "1.0.0",
  "author": "Maulfinity",
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
      "type": "action:keyboard",
      "position": { "x": 700, "y": 200 },
      "config": { "key": "F10", "modifiers": [] }
    },
    {
      "id": "action_zombie",
      "type": "action:sound",
      "position": { "x": 700, "y": 400 },
      "config": { "file": "zombie.mp3", "volume": 0.8 }
    }
  ],
  "connections": [
    { "id": "c1", "from": { "nodeId": "evt_gift", "port": "output" }, "to": { "nodeId": "cond_is_lion", "port": "input" } },
    { "id": "c2", "from": { "nodeId": "cond_is_lion", "port": "true" }, "to": { "nodeId": "logic_random", "port": "input" } },
    { "id": "c3", "from": { "nodeId": "logic_random", "port": "out1" }, "to": { "nodeId": "action_tank", "port": "input" } },
    { "id": "c4", "from": { "nodeId": "logic_random", "port": "out2" }, "to": { "nodeId": "action_zombie", "port": "input" } }
  ],
  "variables": [
    { "name": "spawn_count", "type": "number", "defaultValue": 0 }
  ],
  "settings": {
    "maxExecutionDepth": 100,
    "executionTimeout": 30000
  }
}
```

---

## 5. Node Architecture

### 5.1 Node Lifecycle

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

### 5.2 Node Interface

```typescript
interface IGraphNode {
  // Identity
  readonly type: string
  readonly category: NodeCategory

  // Lifecycle
  onCreate?(context: NodeContext): Promise<void>
  onActivate?(context: NodeContext): Promise<void>
  execute(context: NodeContext): Promise<NodeOutput>
  onDeactivate?(context: NodeContext): Promise<void>
  onDestroy?(): Promise<void>

  // Validation
  validate(config: Record<string, unknown>): boolean

  // UI (for visual editor)
  getInputs(): NodePortDefinition[]
  getOutputs(): NodePortDefinition[]
  getConfigSchema(): ConfigSchema
  render?(): JSX.Element
}
```

### 5.3 Node Categories

| Category | Purpose | Color | Examples |
|----------|---------|-------|----------|
| **Event** | Entry points | Blue | Gift, Comment, Follow |
| **Condition** | Boolean logic | Yellow | Compare, Filter, Random |
| **Logic** | Flow control | Green | AND, OR, NOT, Switch |
| **Delay** | Timing | Purple | Wait, Timer, Throttle |
| **State** | Data storage | Orange | Variable, Counter |
| **Flow** | Execution control | Teal | Cooldown, RateLimit |
| **Action** | Side effects | Red | Keyboard, OBS, Sound |
| **Utility** | Helpers | Gray | Log, Transform |

### 5.4 Node Port System

```typescript
interface NodePortDefinition {
  name: string
  type: PortType
  required: boolean
  default?: unknown
  label?: string
  description?: string
}

type PortType = 'signal' | 'event' | 'data' | 'any'

interface NodePort {
  id: string
  nodeId: string
  portName: string
  direction: 'input' | 'output'
  type: PortType
}
```

### 5.5 Config Schema

```typescript
interface ConfigSchema {
  [key: string]: ConfigField
}

interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'file'
  required?: boolean
  default?: unknown
  label?: string
  description?: string
  options?: string[]
  min?: number
  max?: number
  placeholder?: string
}
```

---

## 6. Core Node Types

### 6.1 Event Nodes

Entry points that receive events from the Event Bus.

| Node | Event Type | Outputs | Config |
|------|------------|---------|--------|
| **Gift** | `gift` | signal, name, count, diamonds | giftName (optional filter) |
| **Comment** | `comment` | signal, text, user | keyword (optional filter) |
| **Follow** | `follow` | signal, user | — |
| **Join** | `join` | signal, user, viewerCount | — |
| **Like** | `like` | signal, user, count | — |
| **SuperChat** | `superchat` | signal, amount, currency, message | minAmount |
| **Membership** | `membership` | signal, tier, months | tier (optional filter) |
| **Game Event** | `game.*` | signal, eventName, data | gameId, eventName |
| **Custom** | `*` | signal, eventType, payload | eventType |

**Example: Gift Node**
```
┌─────────────────────────────┐
│  🎁 Gift Event              │
├─────────────────────────────┤
│  ● signal ──────────────────┤
│  ● name ────────────────────┤
│  ● count ───────────────────┤
│  ● diamonds ────────────────┤
│                             │
│  Filter: [All Gifts    ▼]  │
└─────────────────────────────┘
```

### 6.2 Condition Nodes

Evaluate boolean conditions and route execution.

| Node | Inputs | Outputs | Config |
|------|--------|---------|--------|
| **Compare** | value | true, false | operator, compareValue |
| **GiftName** | signal, name | true, false | name, matchType |
| **CoinValue** | signal, diamonds | true, false | operator, value |
| **Username** | signal, user | true, false | username, matchType |
| **ViewerCount** | signal, count | true, false | operator, value |
| **Platform** | signal, platform | true, false | platforms[] |
| **Random** | signal | out1, out2, ... | probability, outputs |
| **Cooldown** | signal | ready, waiting | seconds |

**Example: Random Node**
```
┌─────────────────────────────┐
│  🎲 Random (50%)            │
├─────────────────────────────┤
│  ◀── signal                 │
│                             │
│  ● true (50%) ─────────────┤
│  ● false (50%) ────────────┤
│                             │
│  Probability: [50    ]%    │
└─────────────────────────────┘
```

### 6.3 Logic Nodes

Combine multiple boolean inputs.

| Node | Inputs | Output | Description |
|------|--------|--------|-------------|
| **AND** | in1, in2, ...inN | out | All inputs must be true |
| **OR** | in1, in2, ...inN | out | Any input can be true |
| **NOT** | in | out | Inverts boolean |
| **Switch** | signal, value | case1, case2, ... | Routes by value |
| **Branch** | condition | true, false | If/else |
| **Gate** | signal, enable | out | Passes if enabled |
| **Sequence** | signal | step1, step2, ... | Executes in order |

### 6.4 Delay Nodes

Control timing of execution.

| Node | Input | Output | Config |
|------|-------|--------|--------|
| **Wait** | signal | signal | seconds |
| **Timer** | start, stop | elapsed, timeout | duration |
| **Throttle** | signal | signal | minInterval |
| **Debounce** | signal | signal | delay |
| **Interval** | signal | signal | interval, count |

### 6.5 State Nodes

Manage persistent data.

| Node | Input | Output | Config |
|------|-------|--------|--------|
| **SetVariable** | signal | signal | name, value |
| **GetVariable** | signal | value | name |
| **Increment** | signal | signal, newValue | counter, amount |
| **Decrement** | signal | signal, newValue | counter, amount |
| **ResetCounter** | signal | signal | counter |
| **CompareVariable** | signal | true, false | name, operator, value |

### 6.6 Action Nodes

Produce side effects via Action Engine.

| Node | Input | Config | Action Type |
|------|-------|--------|-------------|
| **Keyboard** | signal | key, modifiers, mode | `keyboard` |
| **OBS** | signal | command, params | `obs` |
| **Overlay** | signal | overlayId, animation | `overlay` |
| **Sound** | signal | file, volume | `sound` |
| **TTS** | signal | text, voice | `tts` |
| **WebSocket** | signal | url, data | `websocket` |
| **HTTP** | signal | method, url, headers, body | `http` |
| **Game Command** | signal | gameId, action, params | `game` |

---

## 7. Graph Runtime Integration

### 7.1 Runtime Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      GRAPH RUNTIME                               │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ GraphLoader  │  │ NodeExecutor │  │ VariableStore│          │
│  │              │  │              │  │              │          │
│  │ Load graphs  │  │ Run nodes    │  │ Variables    │          │
│  │ from DB/file │  │ in order     │  │ Counters     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │EventMatcher  │  │CtxManager    │  │DebugTracer   │          │
│  │              │  │              │  │              │          │
│  │ Find graphs  │  │ Per-execution│  │ Log execution│          │
│  │ for events   │  │ state        │  │ flow         │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Event Flow

```
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│  Event Bus   │              │ Graph Runtime│              │ Action Engine│
└──────┬───────┘              └──────┬───────┘              └──────┬───────┘
       │                             │                             │
       │  1. MaulfinityEvent         │                             │
       │────────────────────────────▶│                             │
       │                             │                             │
       │                             │  2. Find matching           │
       │                             │     Event Nodes             │
       │                             │────────────┐                │
       │                             │◀───────────┘                │
       │                             │                             │
       │                             │  3. Create ExecutionContext  │
       │                             │────────────┐                │
       │                             │◀───────────┘                │
       │                             │                             │
       │                             │  4. Execute graph traversal │
       │                             │────────────┐                │
       │                             │◀───────────┘                │
       │                             │                             │
       │                             │  5. Action nodes call       │
       │                             │────────────────────────────▶│
       │                             │                             │
       │                             │  6. Actions executed        │
       │                             │◀────────────────────────────│
       │                             │                             │
       │  7. Execution complete      │                             │
       │◀────────────────────────────│                             │
```

### 7.3 Graph Matching

When an event arrives, the Runtime finds all graphs with matching Event Nodes:

```typescript
interface EventMatcher {
  findMatchingGraphs(event: MaulfinityEvent): AutomationGraph[]
  findMatchingNodes(graph: AutomationGraph, event: MaulfinityEvent): GraphNode[]
}
```

**Matching Rules:**

| Rule | Description |
|------|-------------|
| **Type Match** | Node eventType must match event.type |
| **Filter Match** | Node config filters must pass |
| **Enabled Only** | Only enabled graphs are checked |
| **Profile Scope** | Only active profile's graphs |

### 7.4 Execution Context

Each graph execution creates an isolated context:

```typescript
interface ExecutionContext {
  executionId: string
  graphId: string
  triggerEvent: MaulfinityEvent
  startedAt: number
  
  // State
  variables: Map<string, unknown>
  counters: Map<string, number>
  cooldowns: Map<string, number>
  
  // Tracking
  nodeStates: Map<string, NodeState>
  executionPath: string[]  // nodes executed
  depth: number
  parallelCount: number
  aborted: boolean
}
```

### 7.5 Execution Rules

| Rule | Limit | Description |
|------|-------|-------------|
| Max Depth | 100 nodes | Prevents infinite loops |
| Max Duration | 30 seconds | Single execution timeout |
| Max Parallel | 10 | Per graph |
| Max Nodes | 1000 | Per graph |
| Max Connections | 5000 | Per graph |

---

## 8. Plugin Compatibility

### 8.1 Custom Node Registration

Plugins can register custom node types via the Plugin SDK:

```typescript
// In plugin main.ts
export function activate(sdk: PluginSDK) {
  sdk.graph.registerNode({
    type: 'plugin:discord:webhook',
    name: 'Discord Webhook',
    description: 'Send Discord webhook message',
    category: 'action',
    icon: '💬',
    inputs: [
      { name: 'signal', type: 'signal', required: true },
      { name: 'message', type: 'data', required: false }
    ],
    outputs: [
      { name: 'success', type: 'signal' },
      { name: 'error', type: 'signal' }
    ],
    configSchema: {
      webhookUrl: { type: 'string', required: true, label: 'Webhook URL' },
      channel: { type: 'string', label: 'Channel Name' }
    }
  })
}
```

### 8.2 Custom Node Execution

```typescript
class DiscordWebhookNode implements IGraphNode {
  readonly type = 'plugin:discord:webhook'
  readonly category: NodeCategory = 'action'

  async execute(context: NodeContext): Promise<NodeOutput> {
    const { webhookUrl, channel } = context.config
    const message = context.getInput('message') || 'Hello from Maulfinity!'

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
      })

      return { signal: 'success', data: { message } }
    } catch (error) {
      return { signal: 'error', data: { error: (error as Error).message } }
    }
  }
}
```

### 8.3 Plugin Node Discovery

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLUGIN NODE DISCOVERY                         │
│                                                                  │
│  1. PluginManager loads plugins                                 │
│                                                                  │
│  2. Each plugin calls sdk.graph.registerNode()                  │
│                                                                  │
│  3. NodeRegistry stores plugin nodes                            │
│                                                                  │
│  4. Graph Editor shows plugin nodes in palette                  │
│                                                                  │
│  5. Graph Runtime can execute plugin nodes                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Visual Editor Architecture

### 9.1 Editor Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Toolbar: [Save] [Load] [Export] [Import] [Run] [Debug] [⚙]    │
├──────────┬──────────────────────────────────────┬───────────────┤
│          │                                      │               │
│  NODE    │                                      │  INSPECTOR    │
│  LIBRARY │         GRAPH CANVAS                 │               │
│          │                                      │  ┌─────────┐ │
│  📁 Event│    ┌──────┐     ┌──────┐            │  │ Node    │ │
│  🔀 Logic│    │ Node │────▶│ Node │            │  │ Config  │ │
│  ⏱ Delay │    └──────┘     └──────┘            │  │         │ │
│  📊 State│              ┌──────┐               │  │ [field] │ │
│  🎯 Action│             │ Node │               │  │ [field] │ │
│          │              └──────┘               │  └─────────┘ │
│          │                                      │               │
│          │                                      │  PROPERTIES  │
│          │                                      │  ┌─────────┐ │
│          │                                      │  │ Position│ │
│          │                                      │  │ Size    │ │
│          │                                      │  │ ID      │ │
│          │                                      │  └─────────┘ │
├──────────┴──────────────────────────────────────┴───────────────┤
│  DEBUGGER: [▶ Run] [⏸ Pause] [⏹ Stop] │ Status: Idle │ Log: 0 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Component Architecture

```typescript
// Editor state management
interface GraphEditorState {
  // Graph data
  graph: AutomationGraph | null
  selectedNodes: string[]
  selectedConnections: string[]
  
  // Editor mode
  mode: 'select' | 'connect' | 'pan' | 'addNode'
  
  // Viewport
  viewport: { x: number; y: number; zoom: number }
  
  // History
  history: GraphSnapshot[]
  historyIndex: number
  
  // Clipboard
  clipboard: { nodes: GraphNode[]; connections: GraphConnection[] }
  
  // Actions
  addNode(type: string, position: Point): void
  removeNode(nodeId: string): void
  moveNode(nodeId: string, position: Point): void
  updateNodeConfig(nodeId: string, config: Record<string, unknown>): void
  connect(from: NodePort, to: NodePort): void
  disconnect(connectionId: string): void
  undo(): void
  redo(): void
  save(): void
  load(graphId: string): void
}
```

### 9.3 Rendering Technology

| Technology | Use Case | Reason |
|------------|----------|--------|
| **SVG** | Node rendering, connections | DOM-based, easy styling |
| **React** | UI panels, controls | Existing tech stack |
| **Zustand** | State management | Lightweight, TypeScript |
| **Framer Motion** | Animations | Smooth transitions |
| **React Flow** | Node graph | Proven library |

### 9.4 Node Rendering

```typescript
interface NodeRenderer {
  render(node: GraphNode, state: NodeState): JSX.Element
  renderHeader(node: GraphNode): JSX.Element
  renderPorts(ports: NodePortDefinition[]): JSX.Element
  renderConfig(node: GraphNode): JSX.Element
}

// Custom renderers per node type
const nodeRenderers: Map<string, NodeRenderer> = new Map()
```

### 9.5 Connection Rendering

Connections are rendered as SVG Bezier curves:

```typescript
interface ConnectionRenderer {
  renderPath(from: Point, to: Point): string
  renderLabel(text: string): JSX.Element
  highlight(connection: GraphConnection): void
  animateFlow(connection: GraphConnection): void
}
```

---

## 10. Debug System

### 10.1 Debug Features

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEBUG SYSTEM                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Execution Flow Visualization                            │    │
│  │                                                          │    │
│  │  ┌──────┐     ┌──────┐     ┌──────┐                    │    │
│  │  │ ✅   │────▶│ 🔄   │────▶│ ⏳   │                    │    │
│  │  │ Done │     │Running│    │Waiting│                    │    │
│  │  └──────┘     └──────┘     └──────┘                    │    │
│  │                                                          │    │
│  │  Node states: ✅ Done  🔄 Running  ⏳ Waiting  ❌ Error │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Execution Log                                          │    │
│  │                                                          │    │
│  │  10:30:15.123  [Gift Event] Triggered                   │    │
│  │  10:30:15.125  [Compare] GiftName == "Lion" → true      │    │
│  │  10:30:15.127  [Random] 50% → true                      │    │
│  │  10:30:15.130  [Keyboard] F10 pressed                   │    │
│  │  10:30:15.135  [Sound] zombie.mp3 playing               │    │
│  │  10:30:15.200  [Execution] Completed (77ms)             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Debug Modes

| Mode | Description |
|------|-------------|
| **Normal** | Execute without debugging |
| **Step** | Execute one node at a time |
| **Breakpoint** | Stop at specific nodes |
| **Watch** | Monitor variable changes |

### 10.3 Execution History

```typescript
interface ExecutionHistory {
  executions: ExecutionRecord[]
  getNodeHistory(nodeId: string): NodeExecutionRecord[]
  getVariableHistory(variableName: string): VariableChangeRecord[]
}

interface ExecutionRecord {
  id: string
  graphId: string
  triggerEvent: MaulfinityEvent
  startedAt: number
  completedAt: number
  status: 'running' | 'completed' | 'failed' | 'aborted'
  nodesExecuted: string[]
  duration: number
  error?: string
}

interface NodeExecutionRecord {
  nodeId: string
  status: 'running' | 'completed' | 'failed' | 'skipped'
  startedAt: number
  completedAt: number
  duration: number
  input: Record<string, unknown>
  output: Record<string, unknown>
  error?: string
}
```

### 10.4 Error Reporting

```
┌─────────────────────────────────────────────────────────────────┐
│  ERROR REPORTING                                                 │
│                                                                  │
│  ❌ Node Error: Keyboard Action                                 │
│  ├─ Node ID: action_keyboard_001                                │
│  ├─ Error Code: KEY_NOT_FOUND                                   │
│  ├─ Message: Key "F10" not recognized                           │
│  ├─ Duration: 5ms                                               │
│  └─ Stack: ...                                                  │
│                                                                  │
│  ⚠️ Warning: Rate Limit                                         │
│  ├─ Node ID: action_sound_001                                   │
│  ├─ Message: Sound played too frequently                        │
│  └─ Throttled for 2 seconds                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Database & Storage Design

### 11.1 Graphs Table

```sql
CREATE TABLE automation_graphs (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  author TEXT,
  tags TEXT,  -- JSON array
  graph_data TEXT NOT NULL,  -- Full .maulgraph JSON
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
```

### 11.2 Graph Variables Table

```sql
CREATE TABLE graph_variables (
  id TEXT PRIMARY KEY,
  graph_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'number',
  value TEXT NOT NULL DEFAULT '0',  -- JSON encoded
  scope TEXT NOT NULL DEFAULT 'graph',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (graph_id) REFERENCES automation_graphs(id) ON DELETE CASCADE,
  UNIQUE(graph_id, name)
);
```

### 11.3 Graph Executions Table

```sql
CREATE TABLE graph_executions (
  id TEXT PRIMARY KEY,
  graph_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  duration_ms INTEGER,
  nodes_executed INTEGER DEFAULT 0,
  error_message TEXT,
  execution_data TEXT,  -- JSON (full execution trace for debugging)
  FOREIGN KEY (graph_id) REFERENCES automation_graphs(id) ON DELETE CASCADE
);
```

### 11.4 Node Executions Table

```sql
CREATE TABLE node_executions (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  duration_ms INTEGER,
  input_data TEXT,  -- JSON
  output_data TEXT, -- JSON
  error_message TEXT,
  FOREIGN KEY (execution_id) REFERENCES graph_executions(id) ON DELETE CASCADE
);
```

### 11.5 Indexes

```sql
CREATE INDEX idx_graphs_profile ON automation_graphs(profile_id);
CREATE INDEX idx_graphs_enabled ON automation_graphs(enabled);
CREATE INDEX idx_variables_graph ON graph_variables(graph_id);
CREATE INDEX idx_executions_graph ON graph_executions(graph_id);
CREATE INDEX idx_executions_status ON graph_executions(status);
CREATE INDEX idx_node_executions_execution ON node_executions(execution_id);
```

---

## 12. Migration Strategy

### 12.1 Dual Mode Operation

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                              │
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │   TRIGGER EDITOR     │    │   GRAPH EDITOR       │          │
│  │   (Simple Mode)      │    │   (Advanced Mode)    │          │
│  │                      │    │                      │          │
│  │   Form-based UI      │    │   Visual nodes       │          │
│  │   Event dropdown     │    │   Drag & drop        │          │
│  │   Condition fields   │    │   Connection lines   │          │
│  │   Action list        │    │   Real-time preview  │          │
│  └──────────┬───────────┘    └──────────┬───────────┘          │
│             │                           │                       │
│             ▼                           ▼                       │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │   TRIGGER ENGINE     │    │   GRAPH ENGINE       │          │
│  │   (Linear matching)  │    │   (Node execution)   │          │
│  └──────────┬───────────┘    └──────────┬───────────┘          │
│             │                           │                       │
│             └─────────────┬─────────────┘                       │
│                           │                                     │
│                           ▼                                     │
│                  ┌─────────────────┐                            │
│                  │  ACTION ENGINE  │                            │
│                  │  (Shared)       │                            │
│                  └─────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2 Trigger-to-Graph Compilation

Simple triggers are automatically compiled to minimal graphs:

```
Trigger (form-based):
  Event: gift
  Condition: name == "Lion"
  Action: keyboard("F10")

↓ Compiled to ↓

Graph (minimal):
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │Gift Event│───▶│GiftName  │───▶│Keyboard  │
  └──────────┘    │(Lion)    │    │(F10)     │
                  └──────────┘    └──────────┘
```

### 12.3 User Migration Path

| Step | User Action | System Response |
|------|-------------|-----------------|
| 1 | Opens Trigger Editor | Shows form-based UI |
| 2 | Clicks "Advanced Mode" | Switches to Graph Editor |
| 3 | Existing triggers | Auto-compiled to graphs |
| 4 | Creates new graph | Uses Graph Editor |
| 5 | Saves graph | Stored in `automation_graphs` table |

### 12.4 Backward Compatibility

| Feature | Status |
|---------|--------|
| Existing triggers | ✅ Continue working |
| Trigger CRUD API | ✅ Unchanged |
| Event Bus | ✅ Unchanged |
| Action Engine | ✅ Unchanged |
| Overlay Runtime | ✅ Unchanged |

---

## 13. Future Roadmap

### 13.1 Short Term (v0.8)

- [ ] Graph Engine core implementation
- [ ] Basic node types (Event, Condition, Logic, Action)
- [ ] Graph CRUD API
- [ ] Simple graph visualization (read-only)
- [ ] Trigger-to-graph compiler

### 13.2 Medium Term (v0.9)

- [ ] Visual Node Editor (drag & drop)
- [ ] Connection drawing
- [ ] Node configuration panels
- [ ] Undo/redo system
- [ ] Graph templates
- [ ] Export/import graphs

### 13.3 Long Term (v1.0+)

- [ ] Marketplace integration
- [ ] Graph sharing
- [ ] AI-assisted graph creation
- [ ] Collaborative editing
- [ ] Graph versioning
- [ ] Graph analytics
- [ ] Performance profiling

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Automation Graph** | Visual workflow composed of nodes and connections |
| **Node** | Single processing unit in a graph |
| **Connection** | Link between two nodes' ports |
| **Port** | Input or output point on a node |
| **Signal** | Message that triggers node execution |
| **Execution Context** | State for a single graph execution |
| **Variable** | Persistent key-value storage across events |
| **Counter** | Numeric variable with increment/decrement |
| **Cooldown** | Time-based execution limiter |
| **.maulgraph** | File format for graph serialization |

---

## Appendix B: Node Type Quick Reference

| Category | Node | Purpose |
|----------|------|---------|
| Event | Gift, Comment, Follow, Join, Like, SuperChat, Membership, GameEvent, Custom | Entry points |
| Condition | Compare, GiftName, CoinValue, Username, ViewerCount, Platform, Random, Cooldown | Boolean evaluation |
| Logic | AND, OR, NOT, Switch, Branch, Gate, Sequence | Flow control |
| Delay | Wait, Timer, Throttle, Debounce, Interval | Timing |
| State | SetVariable, GetVariable, Increment, Decrement, ResetCounter, CompareVariable | Persistent data |
| Flow | Cooldown, RateLimit, Once, Loop, ForEach | Execution control |
| Action | Keyboard, OBS, Overlay, Sound, TTS, WebSocket, HTTP, GameCommand | Side effects |
| Utility | Log, Transform, Format, Counter, Template | Helpers |

---

**End of Automation Graph Editor Architecture Document**
