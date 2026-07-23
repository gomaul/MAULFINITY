# MAULFINITY CORE PHILOSOPHY
# Automation Graph Engine
# Version 1.0

---

## 1. VISION

Maulfinity bukan sekadar "Indofinity versi baru."

Maulfinity adalah **Visual Automation Platform for Streamers**.

Identitas utama Maulfinity adalah **Automation Graph Engine** — sistem otomasi berbasis node-based workflow yang memungkinkan streamer membuat automasi kompleks tanpa coding.

---

## 2. WHY AUTOMATION GRAPH?

### Masalah Sistem Linear

Sistem trigger linear seperti:

```
Trigger → Action → Finish
```

Tidak cukup untuk automasi kompleks:

**Contoh 1: Random Branching**
```
Gift Lion
  ↓
Random
  ↓
50% → Tank
50% → Helicopter
```

**Contoh 2: Conditional Logic**
```
Gift Lion
  ↓
Check Username
  ↓
VIP → Spawn Tank
Non-VIP → Spawn Bicycle
```

**Contoh 3: State Management**
```
Gift Rose
  ↓
Tambah Counter
  ↓
Kalau Counter = 10
  ↓
Spawn Boss
  ↓
Reset Counter
```

Sistem linear mulai kewalahan.

### Solusi: Automation Graph

Bayangkan seperti **Unreal Engine Blueprint** atau **Node-RED**:

```
     ┌─────────────┐
     │ Gift Event  │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐
     │ Is Lion?    │
     └──────┬──────┘
            │
     ┌──────┴──────┐
     │             │
   Yes            No
     │             │
     ▼             ▼
┌─────────┐  ┌──────────┐
│ Random  │  │ Skip     │
└────┬────┘  └──────────┘
     │
┌────┴────────┐
│             │
▼             ▼
┌───────┐  ┌───────────┐
│ Tank  │  │ Helicopter│
└───┬───┘  └─────┬─────┘
    │            │
    └─────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ OBS Scene   │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ Overlay     │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ TTS         │
   └─────────────┘
```

Semua bisa dilakukan **TANPA coding**.

---

## 3. NODE TYPES

### Event Node (Input)
Node yang menerima event dari connector.

| Node | Description |
|------|-------------|
| Gift | TikTok/YouTube gift |
| Comment | Live chat comment |
| Follow | New follower |
| Join | Viewer join |
| Like | Stream like |
| SuperChat | YouTube super chat |
| Membership | YouTube membership |

### Condition Node
Node yang memeriksa kondisi.

| Node | Description |
|------|-------------|
| Gift Name | Cek nama gift |
| Coin Value | Cek nilai koin |
| Username | Cek nama user |
| Viewer Count | Cek jumlah viewer |
| Random | Random chance (%) |
| Cooldown | Cooldown timer |
| Counter | Cek counter value |
| Variable | Cek variable value |

### Logic Node
Node logika untuk branching.

| Node | Description |
|------|-------------|
| AND | Semua kondisi terpenuhi |
| OR | Salah satu terpenuhi |
| NOT | Kebalikan kondisi |
| Switch | Multi-branch |
| Branch | If/else |
| Loop | Iterasi |

### Delay Node
Node penundaan.

| Node | Description |
|------|-------------|
| Wait | Tunggu X detik |
| Timer | Timer countdown |

### Counter Node
Node penghitung.

| Node | Description |
|------|-------------|
| Increment | Tambah counter |
| Decrement | Kurangi counter |
| Reset | Reset counter |

### Variable Node
Node penyimpanan state.

| Node | Description |
|------|-------------|
| Set | Set variable |
| Get | Get variable |
| Add | Tambah value |

### Action Node (Output)
Node yang menjalankan aksi.

| Node | Description |
|------|-------------|
| Keyboard | Simulate key press |
| OBS | Kontrol OBS |
| Overlay | Tampilkan overlay |
| Sound | Putar audio |
| TTS | Text-to-speech |
| WebSocket | Kirim data external |
| Plugin | Jalankan plugin |

---

## 4. GRAPH STRUCTURE

```typescript
interface AutomationGraph {
  id: string
  name: string
  description: string
  nodes: GraphNode[]
  connections: GraphConnection[]
  variables: GraphVariable[]
  createdAt: string
  updatedAt: string
}

interface GraphNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  config: Record<string, unknown>
  inputs: string[]   // connection IDs
  outputs: string[]  // connection IDs
}

interface GraphConnection {
  id: string
  from: { nodeId: string; output: string }
  to: { nodeId: string; input: string }
}

interface GraphVariable {
  name: string
  type: 'number' | 'string' | 'boolean'
  value: unknown
}
```

---

## 5. EXECUTION FLOW

```
1. Event Received (from Connector)
        │
        ▼
2. Find matching Event Nodes
        │
        ▼
3. Execute Event Node → emit output signal
        │
        ▼
4. Follow connections → execute next nodes
        │
        ▼
5. Continue until no more connections
        │
        ▼
6. Done
```

### Execution Rules

1. **Parallel Execution**: Multiple outputs from one node execute in parallel
2. **Sequential Execution**: Linear connections execute in order
3. **State Persistence**: Variables and counters persist between events
4. **Cooldown**: Cooldown nodes prevent rapid re-execution
5. **Error Recovery**: Failed nodes log errors but don't crash the graph

---

## 6. COMPATIBILITY

### Backward Compatible

Automation Graph tetap mendukung konsep trigger lama:

```
Trigger (old)     → Event Node + Action Node (simple graph)
Condition (old)   → Condition Node
Action (old)      → Action Node
```

### Migration Path

| Phase | UI | Engine |
|-------|-----|--------|
| v0.1 - v0.5 | Form-based Trigger Builder | Linear execution |
| v0.6 | Simple Graph View | Graph Engine (behind scenes) |
| v0.8 | Visual Node Editor | Full Graph Engine |
| v1.0 | Professional Graph Editor | Graph Engine + Marketplace |

---

## 7. MARKETPLACE INTEGRATION

### Graph Sharing

```
Streamer A
    ↓
Export: ZombieChaos.graph
    ↓
Upload to Marketplace
    ↓
Streamer B
    ↓
Import: ZombieChaos.graph
    ↓
Ready to use!
```

### Graph File Format

```json
{
  "name": "Zombie Chaos",
  "version": "1.0.0",
  "author": "Maulfinity",
  "description": "Gift-triggered zombie apocalypse",
  "nodes": [...],
  "connections": [...],
  "variables": [...],
  "assets": ["zombie.png", "explosion.mp3"]
}
```

---

## 8. AI GENERATION (Future)

User bisa ketik:

> "Kalau ada gift Lion, spawn tank, lalu 50% spawn zombie dan ganti OBS scene."

AI otomatis menggambar graph:

```
Gift Lion → Random 50% → Tank → OBS Scene
                │
                └→ 50% → Zombie → OBS Scene
```

Bukan sekadar membuat daftar trigger.

---

## 9. SUMMARY

| Aspect | Linear Trigger | Automation Graph |
|--------|---------------|------------------|
| Complexity | Limited | Unlimited |
| Branching | No | Yes |
| State | No | Yes (variables, counters) |
| Reusability | No | Yes (import/export) |
| Visual | No | Yes (node editor) |
| AI Ready | No | Yes |
| Scalable | No | Yes |

**Automation Graph adalah fondasi yang membuat Maulfinity naik kelas.**

---

**End of Core Philosophy Document**
