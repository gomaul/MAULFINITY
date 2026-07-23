# MAULFINITY — GAME INTEGRATION ARCHITECTURE

> Version 1.0 | July 23, 2026
> Status: Architecture Design (No Implementation)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Game Integration Architecture](#2-game-integration-architecture)
3. [Adapter System Design](#3-adapter-system-design)
4. [Game Bridge Architecture](#4-game-bridge-architecture)
5. [Event Normalization System](#5-event-normalization-system)
6. [Game State Architecture](#6-game-state-architecture)
7. [Game Registry System](#7-game-registry-system)
8. [Security Model](#8-security-model)
9. [Plugin Compatibility](#9-plugin-compatibility)
10. [Database Design](#10-database-design)
11. [Migration Strategy](#11-migration-strategy)
12. [Future Roadmap](#12-future-roadmap)

---

## 1. Executive Summary

Maulfinity will evolve into a **Universal Game Interaction Platform** through the Game Integration Framework.

### Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Adapter-Based** | Each game has its own adapter, not direct memory access |
| **Bridge Communication** | Communication happens through defined bridges (WebSocket, Socket, File) |
| **Event Normalization** | All game events are converted to normalized `MaulfinityEvent` format |
| **Security-First** | No memory injection, no code injection, only external communication |
| **Plugin-Ready** | Third-party developers can create custom game adapters |

### What This Is NOT

| NOT | Instead |
|-----|---------|
| ❌ Game hacks | ✅ Professional adapter integration |
| ❌ Direct memory access | ✅ Bridge-based communication |
| ❌ Memory injection | ✅ External command protocols |
| ❌ Anti-cheat circumvention | ✅ Official/supported integration methods |

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         GAME LAYER                               │
│                                                                  │
│   GTA V    Minecraft    Roblox    Custom Games                   │
│     │          │           │           │                         │
│     ▼          ▼           ▼           ▼                         │
│  ┌──────┐  ┌──────┐    ┌──────┐    ┌──────┐                    │
│  │Adapter│  │Adapter│   │Adapter│   │Adapter│                    │
│  └───┬──┘  └───┬──┘    └───┬──┘    └───┬──┘                    │
│      │         │           │           │                         │
└──────┼─────────┼───────────┼───────────┼────────────────────────┘
       │         │           │           │
       ▼         ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BRIDGE LAYER                               │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │WebSocket     │  │Local Socket  │  │File Watcher  │          │
│  │Bridge        │  │Bridge        │  │Bridge        │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
└─────────┼─────────────────┼──────────────────┼───────────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NORMALIZATION LAYER                           │
│                                                                  │
│              ┌─────────────────────────┐                        │
│              │   Event Normalizer      │                        │
│              │  (Game → MaulfinityEvent)│                        │
│              └───────────┬─────────────┘                        │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EVENT BUS                                   │
│                   (MaulfinityEvent)                              │
└──────────────────────────┬───────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Trigger Engine│  │Automation    │  │Logger        │
│              │  │Engine        │  │              │
└──────┬───────┘  └──────┬───────┘  └──────────────┘
       │                 │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  Action Engine  │
       │  (OBS, Sound,   │
       │   Overlay, TTS) │
       └─────────────────┘
```

---

## 2. Game Integration Architecture

### 2.1 Architecture Overview

The Game Integration Layer is a **completely independent module** that:

1. Receives events from games through adapters
2. Normalizes events into `MaulfinityEvent` format
3. Publishes normalized events to the Event Bus
4. Receives commands from the Action Engine
5. Routes commands to the appropriate game adapter

### 2.2 Layer Separation

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAULFINITY CORE (DO NOT MODIFY)               │
│                                                                  │
│  Event Bus │ Trigger Engine │ Automation Engine │ Action Engine  │
│            │                │                   │                │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Game Integration  │
                    │      Layer         │
                    │   (Sprint 6+)     │
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
    │  Adapters  │      │  Bridges  │      │  Registry │
    │  (Games)   │      │  (Comm)   │      │  (Config) │
    └───────────┘      └───────────┘      └───────────┘
```

### 2.3 Core Components

| Component | Responsibility | Location |
|-----------|---------------|----------|
| **GameAdapterManager** | Manages all game adapters | `src/games/adapters/` |
| **GameBridgeManager** | Manages bridge connections | `src/games/bridges/` |
| **EventNormalizer** | Normalizes game events | `src/games/normalizer/` |
| **GameStateManager** | Tracks game state | `src/games/state/` |
| **GameRegistry** | Registry of supported games | `src/games/registry/` |

### 2.4 Independence Guarantee

The Game Integration Layer:

- **DOES NOT** modify Event Bus
- **DOES NOT** modify Trigger Engine
- **DOES NOT** modify Automation Engine
- **DOES NOT** modify Action Engine
- **ONLY** produces normalized `MaulfinityEvent` objects
- **ONLY** consumes commands from Action Engine

---

## 3. Adapter System Design

### 3.1 Base Game Adapter Interface

```typescript
/**
 * Base interface for all game adapters
 */
interface IGameAdapter {
  // Identity
  readonly gameId: string
  readonly gameName: string
  readonly version: string
  readonly author: string

  // Lifecycle
  connect(): Promise<boolean>
  disconnect(): Promise<void>
  isConnected(): boolean

  // Game Information
  getGameInfo(): GameInfo
  getSupportedEvents(): string[]
  getSupportedCommands(): string[]

  // Event Handling
  subscribeEvents(callback: GameEventCallback): void
  unsubscribeEvents(callback: GameEventCallback): void

  // Command Execution
  sendCommand(command: GameCommand): Promise<GameCommandResult>

  // State
  getState(): GameState
  onStateChange(callback: StateChangeCallback): void

  // Configuration
  configure(config: GameAdapterConfig): void
  getRequiredPermissions(): GamePermission[]
}

/**
 * Game event callback
 */
type GameEventCallback = (event: GameRawEvent) => void

/**
 * State change callback
 */
type StateChangeCallback = (state: GameState) => void

/**
 * Game information
 */
interface GameInfo {
  id: string
  name: string
  version: string
  platform: string  // 'pc', 'console', 'mobile'
  icon: string
  description: string
  website?: string
  adapterVersion: string
}

/**
 * Game raw event (before normalization)
 */
interface GameRawEvent {
  type: string           // Game-specific event type
  timestamp: number
  data: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * Game command
 */
interface GameCommand {
  action: string
  params: Record<string, unknown>
  timeout?: number
}

/**
 * Game command result
 */
interface GameCommandResult {
  success: boolean
  data?: unknown
  error?: string
  duration: number
}

/**
 * Game adapter configuration
 */
interface GameAdapterConfig {
  host?: string
  port?: number
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  customSettings?: Record<string, unknown>
}

/**
 * Game permission
 */
interface GamePermission {
  type: 'read' | 'write' | 'execute'
  resource: string
  description: string
}
```

### 3.2 Adapter Lifecycle

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ CREATED  │────▶│ CONFIGURED│────▶│ CONNECTED│────▶│ ACTIVE   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                       │                │                │
                       │                │                │
                       ▼                ▼                ▼
                 ┌──────────┐     ┌──────────┐     ┌──────────┐
                 │ ERROR    │◀────│ RECONNECT│◀────│DISCONNECT│
                 └──────────┘     └──────────┘     └──────────┘
```

### 3.3 Example Adapter Implementation

```typescript
/**
 * GTA V Adapter Example
 */
class GTAVAdapter implements IGameAdapter {
  readonly gameId = 'gta-v'
  readonly gameName = 'Grand Theft Auto V'
  readonly version = '1.0.0'
  readonly author = 'Maulfinity'

  private bridge: IGameBridge
  private connected = false
  private eventCallbacks: GameEventCallback[] = []

  async connect(): Promise<boolean> {
    this.bridge = new WebSocketBridge({
      host: 'localhost',
      port: 8765
    })

    this.bridge.onMessage((data) => {
      const rawEvent: GameRawEvent = {
        type: data.event,
        timestamp: Date.now(),
        data: data.data
      }
      this.emitEvent(rawEvent)
    })

    return this.bridge.connect()
  }

  async disconnect(): Promise<void> {
    await this.bridge.disconnect()
    this.connected = false
  }

  getGameInfo(): GameInfo {
    return {
      id: this.gameId,
      name: this.gameName,
      version: '1.0.0',
      platform: 'pc',
      icon: 'gta-v.png',
      description: 'Grand Theft Auto V integration',
      adapterVersion: this.version
    }
  }

  getSupportedEvents(): string[] {
    return [
      'player.spawn',
      'player.death',
      'vehicle.spawn',
      'vehicle.destroy',
      'weapon.fire',
      'health.changed',
      'armor.changed',
      'money.changed',
      'wanted.level'
    ]
  }

  getSupportedCommands(): string[] {
    return [
      'spawn.vehicle',
      'spawn.ped',
      'teleport',
      'set.health',
      'set.armor',
      'give.weapon',
      'clearwanted',
      'weather.set',
      'time.set'
    ]
  }

  async sendCommand(command: GameCommand): Promise<GameCommandResult> {
    const start = Date.now()
    try {
      const response = await this.bridge.send({
        action: command.action,
        params: command.params
      })
      return {
        success: true,
        data: response,
        duration: Date.now() - start
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        duration: Date.now() - start
      }
    }
  }

  private emitEvent(event: GameRawEvent): void {
    this.eventCallbacks.forEach(cb => cb(event))
  }
}
```

### 3.4 Adding New Game Adapters

To add support for a new game:

1. **Create adapter class** implementing `IGameAdapter`
2. **Implement bridge communication** (WebSocket, Socket, or File)
3. **Define event mapping** (game events → normalized events)
4. **Define command mapping** (normalized commands → game commands)
5. **Register with GameRegistry**

---

## 4. Game Bridge Architecture

### 4.1 Bridge Interface

```typescript
/**
 * Base interface for all game bridges
 */
interface IGameBridge {
  readonly type: 'websocket' | 'socket' | 'file'

  connect(): Promise<boolean>
  disconnect(): Promise<void>
  isConnected(): boolean

  send(data: unknown): Promise<unknown>
  onMessage(callback: (data: unknown) => void): void
  onError(callback: (error: Error) => void): void
  onClose(callback: () => void): void
}
```

### 4.2 WebSocket Bridge

```
┌──────────────┐              ┌──────────────┐
│  Maulfinity  │◄────────────►│  Game Plugin │
│  (Client)    │  WebSocket   │  (Server)    │
└──────────────┘  localhost   └──────────────┘
                  :8765
```

**Use Case:** Games with plugin support (GTA V/FiveM, Minecraft)

**Protocol:**
```json
// Request (Maulfinity → Game)
{
  "id": "req_001",
  "action": "spawn.vehicle",
  "params": {
    "model": "adder",
    "position": { "x": 100, "y": 200, "z": 30 }
  }
}

// Response (Game → Maulfinity)
{
  "id": "req_001",
  "success": true,
  "data": {
    "vehicleId": "veh_123"
  }
}

// Event (Game → Maulfinity)
{
  "type": "player.spawn",
  "timestamp": 1234567890,
  "data": {
    "position": { "x": 100, "y": 200, "z": 30 }
  }
}
```

### 4.3 Local Socket Bridge

```
┌──────────────┐              ┌──────────────┐
│  Maulfinity  │◄────────────►│  Game Mod    │
│  (Client)    │  Named Pipe  │  (Server)    │
└──────────────┘  or Unix     └──────────────┘
                  Socket
```

**Use Case:** Games with mod support but no WebSocket

**Protocol:** Same as WebSocket but over named pipe/Unix socket

### 4.4 File Watcher Bridge

```
┌──────────────┐              ┌──────────────┐
│  Maulfinity  │◄─────────────│  Game Mod    │
│  (Watcher)   │  File System │  (Writer)    │
└──────────────┘              └──────────────┘
       │
       ▼
  watch specific
  directory for
  JSON files
```

**Use Case:** Games with file-based modding

**Protocol:**
```json
// Event file: /maulfinity/events/event_001.json
{
  "type": "player.spawn",
  "timestamp": 1234567890,
  "data": {
    "position": { "x": 100, "y": 200, "z": 30 }
  }
}

// Command file: /maulfinity/commands/cmd_001.json
{
  "action": "spawn.vehicle",
  "params": {
    "model": "adder"
  }
}

// Response file: /maulfinity/responses/cmd_001.json
{
  "success": true,
  "data": {
    "vehicleId": "veh_123"
  }
}
```

### 4.5 Bridge Selection Guide

| Game Type | Recommended Bridge | Reason |
|-----------|-------------------|--------|
| FiveM/GTA V | WebSocket | Plugin support, real-time |
| Minecraft | WebSocket | Plugin API available |
| Roblox | WebSocket | HTTP/WebSocket APIs |
| Unity Games | WebSocket/Socket | Plugin support |
| Unreal Games | File Watcher | Limited mod support |
| Console Games | N/A | Not supported |

---

## 5. Event Normalization System

### 5.1 Normalization Concept

Different games use different event naming:

| Game A | Game B | Normalized |
|--------|--------|------------|
| `health_changed` | `hp_update` | `player.health.changed` |
| `vehicle_spawned` | `car_summon` | `vehicle.spawned` |
| `player_died` | `death_event` | `player.death` |

### 5.2 Normalized Event Schema

```typescript
/**
 * Normalized game event (extends MaulfinityEvent)
 */
interface GameEvent extends MaulfinityEvent {
  type: string          // Normalized type: 'player.health.changed'
  platform: 'game'      // Always 'game' for game events
  source: {
    gameId: string      // 'gta-v', 'minecraft', etc.
    adapterId: string   // Which adapter produced this
  }
  payload: {
    category: string    // 'player', 'vehicle', 'world', 'combat'
    action: string      // 'health.changed', 'vehicle.spawned'
    data: Record<string, unknown>
  }
}
```

### 5.3 Event Type Categories

| Category | Events | Examples |
|----------|--------|----------|
| **Player** | spawn, death, health, armor, money, wanted | `player.health.changed` |
| **Vehicle** | spawn, destroy, enter, exit, damage | `vehicle.spawned` |
| **Combat** | weapon.fire, damage, kill | `combat.weapon.fired` |
| **World** | weather, time, area | `world.weather.changed` |
| **Economy** | money.gained, money.lost | `economy.money.changed` |
| **Custom** | game-specific events | `gta.mission.started` |

### 5.4 Event Normalizer Interface

```typescript
/**
 * Event normalizer - converts game events to normalized format
 */
interface IEventNormalizer {
  normalize(gameId: string, rawEvent: GameRawEvent): GameEvent
  getSupportedGames(): string[]
  getEventMapping(gameId: string): EventMapping[]
}

/**
 * Event mapping definition
 */
interface EventMapping {
  gameEvent: string           // 'health_changed'
  normalizedEvent: string     // 'player.health.changed'
  category: string            // 'player'
  transformer?: (data: Record<string, unknown>) => Record<string, unknown>
}
```

### 5.5 Example Normalization

```typescript
// GTA V Adapter
const gtaMappings: EventMapping[] = [
  {
    gameEvent: 'player_spawned',
    normalizedEvent: 'player.spawned',
    category: 'player'
  },
  {
    gameEvent: 'player_died',
    normalizedEvent: 'player.death',
    category: 'player'
  },
  {
    gameEvent: 'vehicle_created',
    normalizedEvent: 'vehicle.spawned',
    category: 'vehicle',
    transformer: (data) => ({
      model: data.model,
      position: data.position,
      owner: data.playerId
    })
  }
]

// Minecraft Adapter
const minecraftMappings: EventMapping[] = [
  {
    gameEvent: 'player_join',
    normalizedEvent: 'player.spawned',
    category: 'player'
  },
  {
    gameEvent: 'player_death',
    normalizedEvent: 'player.death',
    category: 'player'
  },
  {
    gameEvent: 'entity_spawn',
    normalizedEvent: 'entity.spawned',
    category: 'world',
    transformer: (data) => ({
      type: data.entityType,
      position: data.position
    })
  }
]
```

---

## 6. Game State Architecture

### 6.1 State Types

```typescript
/**
 * Player state - per-player data
 */
interface PlayerState {
  id: string
  name: string
  health: number
  maxHealth: number
  armor: number
  position: { x: number; y: number; z: number }
  rotation: number
  isInVehicle: boolean
  vehicleId?: string
  weapons: string[]
  money: number
  wantedLevel: number
}

/**
 * Game state - global game data
 */
interface GameState {
  gameId: string
  timestamp: number
  players: Map<string, PlayerState>
  vehicles: Map<string, VehicleState>
  world: WorldState
  session: SessionState
}

/**
 * Vehicle state
 */
interface VehicleState {
  id: string
  model: string
  position: { x: number; y: number; z: number }
  rotation: number
  health: number
  speed: number
  driver?: string
  passengers: string[]
}

/**
 * World state
 */
interface WorldState {
  weather: string
  time: { hour: number; minute: number }
  area: string
  isNight: boolean
}

/**
 * Session state
 */
interface SessionState {
  sessionId: string
  startTime: number
  duration: number
  eventsCount: number
  commandsCount: number
}
```

### 6.2 Reactive State Updates

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Game Event  │────▶│ State Update │────▶│ State Emit   │
│  (Raw)       │     │              │     │ (Normalized) │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Subscribers │
                     │  (UI, Logs)  │
                     └──────────────┘
```

### 6.3 State Synchronization

```typescript
/**
 * State synchronization strategy
 */
interface StateSyncStrategy {
  // Full sync on connect
  fullSync(): Promise<GameState>
  
  // Incremental updates
  onStateUpdate(callback: (update: StateUpdate) => void): void
  
  // Request specific state
  requestState(path: string): Promise<unknown>
}

/**
 * State update
 */
interface StateUpdate {
  path: string           // 'player.health'
  operation: 'set' | 'add' | 'remove'
  value: unknown
  timestamp: number
}
```

---

## 7. Game Registry System

### 7.1 Registry Interface

```typescript
/**
 * Game registry - manages installed games
 */
interface IGameRegistry {
  // Registration
  registerGame(game: GameRegistration): void
  unregisterGame(gameId: string): void
  
  // Queries
  getRegisteredGames(): GameRegistration[]
  getGame(gameId: string): GameRegistration | undefined
  
  // Active game
  setActiveGame(gameId: string): void
  getActiveGame(): GameRegistration | null
  
  // Status
  getGameStatus(gameId: string): GameStatus
}

/**
 * Game registration
 */
interface GameRegistration {
  id: string
  name: string
  version: string
  adapter: IGameAdapter
  config: GameConfig
  status: GameStatus
  installedAt: string
  lastUsed?: string
}

/**
 * Game status
 */
type GameStatus = 'installed' | 'configured' | 'connected' | 'error'

/**
 * Game configuration
 */
interface GameConfig {
  bridgeType: 'websocket' | 'socket' | 'file'
  bridgeConfig: Record<string, unknown>
  autoConnect: boolean
  permissions: GamePermission[]
  customSettings: Record<string, unknown>
}
```

### 7.2 Registry Storage

```json
{
  "games": [
    {
      "id": "gta-v",
      "name": "Grand Theft Auto V",
      "version": "1.0.0",
      "status": "connected",
      "config": {
        "bridgeType": "websocket",
        "bridgeConfig": {
          "host": "localhost",
          "port": 8765
        },
        "autoConnect": true,
        "permissions": ["read", "write", "execute"]
      },
      "installedAt": "2026-07-23T10:00:00Z",
      "lastUsed": "2026-07-23T12:30:00Z"
    }
  ]
}
```

### 7.3 UI Components

```
┌─────────────────────────────────────────────────────────────┐
│                    GAME MANAGER                              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Installed Games                                      │    │
│  │                                                      │    │
│  │  🎮 GTA V          ● Connected    [Configure] [Stop]│    │
│  │  🎮 Minecraft      ○ Disconnected [Connect] [Config]│    │
│  │  🎮 Roblox         ○ Not Setup    [Setup] [Remove]  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Active Game: GTA V                                   │    │
│  │                                                      │    │
│  │  Player: JohnDoe    Health: 100  Armor: 50          │    │
│  │  Vehicle: Adder     Speed: 120 km/h                 │    │
│  │  Money: $1,234,567  Wanted: ⭐⭐                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Available Games                                      │    │
│  │                                                      │    │
│  │  🎮 Red Dead Redemption 2    [Install Adapter]       │    │
│  │  🎮 Cyberpunk 2077          [Install Adapter]       │    │
│  │  🎮 Valheim                 [Install Adapter]       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Security Model

### 8.1 Permission System

```typescript
/**
 * Game permission types
 */
interface GamePermission {
  type: 'read' | 'write' | 'execute'
  resource: string
  description: string
}

// Example permissions
const PERMISSIONS = {
  READ_STATE: {
    type: 'read',
    resource: 'state',
    description: 'Read game state (health, position, etc.)'
  },
  READ_EVENTS: {
    type: 'read',
    resource: 'events',
    description: 'Receive game events'
  },
  WRITE_COMMANDS: {
    type: 'write',
    resource: 'commands',
    description: 'Send commands to game'
  },
  EXECUTE_SCRIPTS: {
    type: 'execute',
    resource: 'scripts',
    description: 'Execute game scripts'
  }
}
```

### 8.2 Adapter Isolation

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY BOUNDARY                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  GTA V Adapter (Sandboxed)                          │    │
│  │  - Can only access GTA V bridge                     │    │
│  │  - Cannot access other adapters                     │    │
│  │  - Cannot access file system                        │    │
│  │  - Cannot execute arbitrary code                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Minecraft Adapter (Sandboxed)                      │    │
│  │  - Can only access Minecraft bridge                 │    │
│  │  - Cannot access other adapters                     │    │
│  │  - Cannot access file system                        │    │
│  │  - Cannot execute arbitrary code                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 External Connection Validation

```typescript
/**
 * Connection validation
 */
interface ConnectionValidator {
  // Validate incoming connection
  validateConnection(connection: Connection): ValidationResult
  
  // Validate message
  validateMessage(message: unknown): ValidationResult
  
  // Rate limiting
  checkRateLimit(clientId: string): boolean
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean
  reason?: string
  action?: 'allow' | 'deny' | 'throttle'
}
```

### 8.4 Security Rules

| Rule | Description |
|------|-------------|
| **No Memory Access** | Adapters cannot read/write game memory directly |
| **No Code Injection** | Adapters cannot inject code into games |
| **Sandboxed Execution** | Each adapter runs in isolated context |
| **Rate Limiting** | Commands are rate-limited to prevent abuse |
| **Permission Checks** | All operations require explicit permissions |
| **Connection Validation** | External connections are validated |
| **Audit Logging** | All commands are logged for debugging |

---

## 9. Plugin Compatibility

### 9.1 Plugin Adapter Interface

```typescript
/**
 * Plugin can provide game adapter
 */
interface GameAdapterPlugin {
  // Plugin metadata
  manifest: PluginManifest
  
  // Adapter factory
  createAdapter(config: GameAdapterConfig): IGameAdapter
  
  // Adapter info
  getAdapterInfo(): GameInfo
  getRequiredBridge(): string  // 'websocket', 'socket', 'file'
}

/**
 * Plugin manifest
 */
interface PluginManifest {
  name: string
  version: string
  author: string
  description: string
  permissions: string[]
}
```

### 9.2 Plugin Registration

```typescript
// In plugin main.ts
import { GameRegistry } from '@games/registry'

export function activate(gameRegistry: IGameRegistry) {
  // Register game adapter
  gameRegistry.registerGame({
    id: 'my-game',
    name: 'My Custom Game',
    version: '1.0.0',
    adapter: new MyGameAdapter(),
    config: {
      bridgeType: 'websocket',
      bridgeConfig: { port: 8765 },
      autoConnect: false,
      permissions: ['read', 'write'],
      customSettings: {}
    },
    status: 'installed',
    installedAt: new Date().toISOString()
  })
}

export function deactivate(gameRegistry: IGameRegistry) {
  gameRegistry.unregisterGame('my-game')
}
```

### 9.3 Future: Game Adapter Marketplace

```
┌─────────────────────────────────────────────────────────────┐
│                    GAME ADAPTER MARKETPLACE                  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🔍 Search: "gta"                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🎮 GTA V (FiveM)                                    │    │
│  │    by Maulfinity Team                               │    │
│  │    ⭐ 4.8 (120 reviews)                             │    │
│  │    [Install] [Details]                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🎮 GTA V (Single Player)                            │    │
│  │    by Community                                     │    │
│  │    ⭐ 4.2 (45 reviews)                              │    │
│  │    [Install] [Details]                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Database Design

### 10.1 Games Table

```sql
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  adapter_version TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'pc',
  icon TEXT,
  description TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'installed',
  installed_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 10.2 Game Settings Table

```sql
CREATE TABLE game_settings (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  bridge_type TEXT NOT NULL DEFAULT 'websocket',
  bridge_config TEXT NOT NULL DEFAULT '{}',  -- JSON
  auto_connect INTEGER NOT NULL DEFAULT 0,
  permissions TEXT NOT NULL DEFAULT '[]',     -- JSON array
  custom_settings TEXT NOT NULL DEFAULT '{}', -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);
```

### 10.3 Game Sessions Table

```sql
CREATE TABLE game_sessions (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  duration_ms INTEGER,
  events_count INTEGER DEFAULT 0,
  commands_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);
```

### 10.4 Game Events Table

```sql
CREATE TABLE game_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  raw_data TEXT,        -- JSON (original game event)
  normalized_data TEXT, -- JSON (normalized event)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);
```

### 10.5 Game Commands Table

```sql
CREATE TABLE game_commands (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  action TEXT NOT NULL,
  params TEXT NOT NULL DEFAULT '{}',  -- JSON
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT,                         -- JSON
  error TEXT,
  duration_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);
```

---

## 11. Migration Strategy

### 11.1 Integration Approach

```
┌─────────────────────────────────────────────────────────────┐
│                    EXISTING SYSTEMS (DO NOT MODIFY)          │
│                                                              │
│  Event Bus │ Trigger Engine │ Automation │ Action Engine     │
│            │                │ Engine     │                   │
└────────────┴────────────────┴────────────┴───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Game Integration │
                    │      Layer        │
                    │   (NEW MODULE)    │
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
    │  Adapters  │      │  Bridges  │      │  Registry │
    │  (NEW)     │      │  (NEW)    │      │  (NEW)    │
    └───────────┘      └───────────┘      └───────────┘
```

### 11.2 No Breaking Changes

| System | Impact | Changes |
|--------|--------|---------|
| Event Bus | None | Game events are published as `MaulfinityEvent` |
| Trigger Engine | None | Triggers can match game events |
| Automation Engine | None | Automation graphs can use game events |
| Action Engine | None | Game commands are executed via Action Engine |
| OBS Service | None | OBS actions remain unchanged |
| Overlay Runtime | None | Overlays can display game state |

### 11.3 Event Flow Integration

```
Game Event
    │
    ▼
Game Adapter
    │
    ▼
Event Normalizer
    │
    ▼
MaulfinityEvent (normalized)
    │
    ▼
Event Bus (existing)
    │
    ├──▶ Trigger Engine (existing)
    ├──▶ Automation Engine (existing)
    └──▶ Logger (existing)
```

### 11.4 Command Flow Integration

```
User Action (via Trigger/Automation)
    │
    ▼
Action Engine (existing)
    │
    ▼
Game Command Action (new)
    │
    ▼
Game Adapter
    │
    ▼
Game Bridge
    │
    ▼
Game Plugin/Mod
```

---

## 12. Future Roadmap

### 12.1 Short Term (Sprint 6-7)

- [ ] GameAdapter base class implementation
- [ ] WebSocket Bridge implementation
- [ ] Event Normalizer implementation
- [ ] Game Registry implementation
- [ ] GTA V (FiveM) adapter
- [ ] Basic game state tracking

### 12.2 Medium Term (Sprint 8-9)

- [ ] Local Socket Bridge
- [ ] File Watcher Bridge
- [ ] Minecraft adapter
- [ ] Roblox adapter
- [ ] Game state visualization UI
- [ ] Game session recording

### 12.3 Long Term (v1.0+)

- [ ] Game Adapter Marketplace
- [ ] Community game adapters
- [ ] AI-assisted game integration
- [ ] Cross-game automation
- [ ] Console game support (via companion apps)

---

## Appendix A: Supported Games (Planned)

| Game | Platform | Bridge | Adapter Status |
|------|----------|--------|----------------|
| GTA V (FiveM) | PC | WebSocket | 🟢 Planned |
| Minecraft | PC | WebSocket | 🟡 Planned |
| Roblox | PC/Web | WebSocket | 🟡 Planned |
| Red Dead 2 | PC | WebSocket | 🔴 Future |
| Cyberpunk 2077 | PC | File Watcher | 🔴 Future |
| Valheim | PC | WebSocket | 🔴 Future |

---

**End of Game Integration Architecture Document**
