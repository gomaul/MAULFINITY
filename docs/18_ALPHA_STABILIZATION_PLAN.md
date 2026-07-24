# MAULFINITY — SPRINT 9: ALPHA STABILIZATION PLAN

> **Sprint:** 9 — Alpha Stabilization
> **Date:** July 24, 2026
> **Author:** Buffy (AI Development Assistant)
> **Status:** Planning Phase (No Implementation)
> **Prerequisite:** docs/17_ALPHA_REFACTOR_PLAN.md

---

## Table of Contents

1. [Objective](#1-objective)
2. [Refactor Execution Mapping](#2-refactor-execution-mapping)
3. [Implementation Order](#3-implementation-order)
4. [Core System Stabilization](#4-core-system-stabilization)
5. [IPC Stabilization](#5-ipc-stabilization)
6. [Connector Stabilization](#6-connector-stabilization)
7. [Overlay Runtime Stabilization](#7-overlay-runtime-stabilization)
8. [Testing Strategy](#8-testing-strategy)
9. [Alpha Release Criteria](#9-alpha-release-criteria)
10. [Final Decision](#10-final-decision)

---

## 1. Objective

### 1.1 Why Stabilization Is Needed

Maulfinity has completed Sprints 0–8, establishing a modular architecture with all major subsystems scaffolded. However, the architecture audit (docs/16_ALPHA_ARCHITECTURE_AUDIT.md) revealed critical gaps:

| Gap | Impact | Risk Level |
|-----|--------|------------|
| ApplicationCore not wired in main | App may not start | Critical |
| No testing infrastructure | Cannot verify changes | Critical |
| Plugin SDK stubs | Plugins non-functional | High |
| No plugin sandboxing | Security vulnerability | High |
| 40+ `any` types | Runtime errors possible | High |
| Placeholder actions | Features incomplete | Medium |

**Without stabilization, Alpha testing cannot proceed safely.**

### 1.2 Expected Alpha State

After Sprint 9 completion, Maulfinity should achieve:

| Criterion | Target | Current |
|-----------|--------|---------|
| Application Startup | Reliable, <500ms | Unverified |
| TypeScript Compilation | 0 errors | Unverified |
| Unit Test Coverage | ≥60% critical paths | 0% |
| `any` Types | 0 in core modules | 40+ |
| Plugin System | Functional SDK | Stubs |
| Core Actions | All functional | 3 placeholders |
| Security | No critical vulnerabilities | Plugin sandbox missing |

**Target Score:** 75+/100 (Alpha Ready) from current 66/100 (Pre-Alpha)

---

## 2. Refactor Execution Mapping

Converting docs/17_ALPHA_REFACTOR_PLAN.md into actionable Sprint 9 tasks:

### Task 1: Wire ApplicationCore in Main

| Field | Value |
|-------|-------|
| **Task** | Import and call ApplicationCore.start() in main/index.ts bootstrap function |
| **Priority** | **Critical** |
| **Affected Files** | `src/main/index.ts` |
| **Affected Systems** | Application Startup, All Engines |
| **Risk** | Medium — May reveal initialization order issues |
| **Testing Requirement** | Manual: App starts without errors; Unit: ApplicationCore.start() completes |

---

### Task 2: Add Testing Infrastructure

| Field | Value |
|-------|-------|
| **Task** | Install Vitest, create config, write first unit tests |
| **Priority** | **Critical** |
| **Affected Files** | `package.json`, `vitest.config.ts`, `src/**/*.test.ts` |
| **Affected Systems** | All Systems (testing) |
| **Risk** | Low — Additive, no breaking changes |
| **Testing Requirement** | Tests pass; Coverage report generated |

---

### Task 3: Write EventBus Unit Tests

| Field | Value |
|-------|-------|
| **Task** | Write comprehensive unit tests for EventBus |
| **Priority** | **Critical** |
| **Affected Files** | `src/core/event-bus/EventBus.test.ts` |
| **Affected Systems** | EventBus |
| **Risk** | Low — Tests only |
| **Testing Requirement** | ≥80% coverage; All tests pass |

**Test Cases:**
- Singleton pattern
- on/once/off subscriptions
- Wildcard matching
- Event history
- Error recovery
- Statistics tracking

---

### Task 4: Write ServiceContainer Unit Tests

| Field | Value |
|-------|-------|
| **Task** | Write comprehensive unit tests for ServiceContainer |
| **Priority** | **Critical** |
| **Affected Files** | `src/core/service-container/ServiceContainer.test.ts` |
| **Affected Systems** | ServiceContainer |
| **Risk** | Low — Tests only |
| **Testing Requirement** | ≥80% coverage; All tests pass |

**Test Cases:**
- register/registerInstance
- resolve/resolveSync
- Singleton caching
- Error handling
- initializeAll

---

### Task 5: Write ActionEngine Unit Tests

| Field | Value |
|-------|-------|
| **Task** | Write unit tests for ActionEngine and ActionRegistry |
| **Priority** | **Critical** |
| **Affected Files** | `src/core/action-engine/ActionEngine.test.ts` |
| **Affected Systems** | ActionEngine |
| **Risk** | Low — Tests only |
| **Testing Requirement** | ≥70% coverage; All tests pass |

**Test Cases:**
- Action registration
- Action execution
- Action validation
- Error handling

---

### Task 6: Replace Critical `any` Types

| Field | Value |
|-------|-------|
| **Task** | Replace `any` types in PluginSDK.ts, PluginManager.ts with proper interfaces |
| **Priority** | **High** |
| **Affected Files** | `src/plugins/sdk/PluginSDK.ts`, `src/plugins/PluginManager.ts` |
| **Affected Systems** | Plugin System, Type Safety |
| **Risk** | Medium — May reveal type mismatches |
| **Testing Requirement** | TypeScript compiles with 0 errors |

---

### Task 7: Replace Console.log with Logger

| Field | Value |
|-------|-------|
| **Task** | Replace all console.log/error in main process and IPC with Logger |
| **Priority** | **Medium** |
| **Affected Files** | `src/main/ipc/*.ts`, `src/services/database/migrations/*.ts` |
| **Affected Systems** | Logging |
| **Risk** | Low — Logging only |
| **Testing Requirement** | Logs written to file; No console output in production |

---

### Task 8: Implement SoundAction

| Field | Value |
|-------|-------|
| **Task** | Implement basic audio playback using node speaker or HTML5 Audio |
| **Priority** | **High** |
| **Affected Files** | `src/core/action-engine/actions/SoundAction.ts` |
| **Affected Systems** | Action Engine |
| **Risk** | Medium — Audio system dependencies |
| **Testing Requirement** | Sound plays on trigger; No crashes |

---

### Task 9: Implement TtsAction

| Field | Value |
|-------|-------|
| **Task** | Implement basic text-to-speech using system TTS or external API |
| **Priority** | **High** |
| **Affected Files** | `src/core/action-engine/actions/TtsAction.ts` |
| **Affected Systems** | Action Engine |
| **Risk** | Medium — System TTS availability varies |
| **Testing Requirement** | TTS speaks on trigger; No crashes |

---

### Task 10: Implement OverlayAction

| Field | Value |
|-------|-------|
| **Task** | Implement overlay triggering via OverlayRuntime |
| **Priority** | **High** |
| **Affected Files** | `src/core/action-engine/actions/OverlayAction.ts` |
| **Affected Systems** | Action Engine, Overlay System |
| **Risk** | Medium — OverlayRuntime connection needed |
| **Testing Requirement** | Overlay displays on trigger; No crashes |

---

### Task 11: Connect OverlayRuntime to BrowserSourceServer

| Field | Value |
|-------|-------|
| **Task** | Wire OverlayRuntime to BrowserSourceServer for OBS rendering |
| **Priority** | **High** |
| **Affected Files** | `src/overlay/runtime/OverlayRuntime.ts`, `src/services/browser-source/BrowserSourceServer.ts` |
| **Affected Systems** | Overlay System, OBS Integration |
| **Risk** | High — Complex integration |
| **Testing Requirement** | Overlay renders in OBS browser source |

---

### Task 12: Add IPC Input Validation

| Field | Value |
|-------|-------|
| **Task** | Add Zod validation schemas to critical IPC handlers |
| **Priority** | **High** |
| **Affected Files** | `src/main/ipc/*.ts` |
| **Affected Systems** | IPC, Security |
| **Risk** | Low — Additive validation |
| **Testing Requirement** | Invalid inputs rejected; Valid inputs pass |

---

### Task 13: Complete Trigger UI Page

| Field | Value |
|-------|-------|
| **Task** | Implement trigger CRUD operations in Triggers.tsx |
| **Priority** | **Medium** |
| **Affected Files** | `src/renderer/pages/Triggers.tsx` |
| **Affected Systems** | UI, Trigger Engine |
| **Risk** | Medium — UI complexity |
| **Testing Requirement** | Create, edit, delete triggers; Triggers execute |

---

### Task 14: Complete Automation UI Page

| Field | Value |
|-------|-------|
| **Task** | Implement automation CRUD operations in Automation.tsx |
| **Priority** | **Medium** |
| **Affected Files** | `src/renderer/pages/Automation.tsx` |
| **Affected Systems** | UI, Automation Engine |
| **Risk** | Medium — UI complexity |
| **Testing Requirement** | Create, edit, delete automations; Automations execute |

---

### Task 15: Runtime Verification

| Field | Value |
|-------|-------|
| **Task** | Run full application verification after all fixes |
| **Priority** | **Critical** |
| **Affected Files** | All |
| **Affected Systems** | All |
| **Risk** | Low — Verification only |
| **Testing Requirement** | All checks pass |

---

## 3. Implementation Order

### Exact Execution Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPRINT 9 EXECUTION FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Wire ApplicationCore ──────────────────────┐           │
│           (Critical - Must be first)                 │           │
│                                                      ▼           │
│  Step 2: Add Vitest Infrastructure ────────────────┐            │
│           (Critical - Enables testing)              │            │
│                                                    ▼             │
│  Step 3: Write Core Engine Tests ──────────────────┐            │
│           • EventBus tests                         │            │
│           • ServiceContainer tests                 │            │
│           • ActionEngine tests                     │            │
│                                                    ▼             │
│  Step 4: Replace `any` Types ──────────────────────┐            │
│           • PluginSDK.ts                           │            │
│           • PluginManager.ts                       │            │
│                                                    ▼             │
│  Step 5: Replace console.log ──────────────────────┐            │
│           • Main process files                     │            │
│           • IPC handlers                           │            │
│                                                    ▼             │
│  Step 6: Implement Placeholder Actions ────────────┐            │
│           • SoundAction                            │            │
│           • TtsAction                              │            │
│           • OverlayAction                          │            │
│                                                    ▼             │
│  Step 7: Connect Overlay Runtime ──────────────────┐            │
│           • Wire to BrowserSourceServer            │            │
│                                                    ▼             │
│  Step 8: Add IPC Validation ───────────────────────┐            │
│           • Zod schemas for handlers               │            │
│                                                    ▼             │
│  Step 9: Complete UI Pages ────────────────────────┐            │
│           • Triggers page                          │            │
│           • Automation page                        │            │
│                                                    ▼             │
│  Step 10: Final Verification ──────────────────────┘            │
│            • Runtime test                                        │
│            • All tests pass                                      │
│            • Manual validation                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Dependency Graph

| Step | Depends On | Reason |
|------|------------|--------|
| 1 | None | Must verify app starts first |
| 2 | None | Can be done in parallel with Step 1 |
| 3 | Step 2 | Needs Vitest installed |
| 4 | None | Independent, but after tests |
| 5 | None | Independent |
| 6 | Step 1 | App must start to test actions |
| 7 | Step 6 | OverlayAction needs OverlayRuntime |
| 8 | None | Independent |
| 9 | Steps 1, 6 | App must start, actions must work |
| 10 | All | Final verification |

---

## 4. Core System Stabilization

### 4.1 ApplicationCore

**Current State:**
- ApplicationCore class exists with proper lifecycle
- NOT wired in main/index.ts bootstrap

**Target State:**
- ApplicationCore.start() called on app launch
- All engines initialize in correct order
- Graceful shutdown on app exit

**Stabilization Steps:**

1. **Modify `src/main/index.ts`:**
   ```typescript
   import { ApplicationCore } from '@core/application/ApplicationCore'
   
   const bootstrap = async () => {
     const appCore = ApplicationCore.getInstance()
     await appCore.start()
     createWindow()
   }
   ```

2. **Verify initialization order:**
   - ConfigManager loads first
   - Database initializes
   - EventBus starts
   - Engines register
   - Connectors ready

3. **Add error handling:**
   - Catch startup errors
   - Log to file
   - Show user-friendly error

**Files to Modify:**
- `src/main/index.ts`

---

### 4.2 ServiceContainer

**Current State:**
- 15 services registered
- 25+ modules use direct getInstance()

**Target State:**
- All singletons registered
- Consistent access pattern

**Stabilization Steps:**

1. **Register missing singletons:**
   - TriggerEngine
   - AutomationEngine
   - GameManager
   - PluginManager

2. **Verify registration order:**
   - EventBus first (dependency)
   - ConfigManager second
   - Others after

3. **Keep getInstance() as fallback:**
   - Don't break existing code
   - Gradual migration

**Files to Modify:**
- `src/core/application/ApplicationCore.ts`

---

### 4.3 ModuleManager

**Current State:**
- Well-implemented lifecycle
- Dependency resolution working

**Target State:**
- No changes needed (works well)

**Stabilization Steps:**

1. **No changes required**
2. **Document current behavior**
3. **Add health monitoring (future)**

---

### 4.4 EventBus

**Current State:**
- Singleton pattern
- Wildcard support
- History buffer
- Statistics

**Target State:**
- No critical changes needed

**Stabilization Steps:**

1. **No changes required**
2. **Write comprehensive tests**
3. **Monitor performance**

**Files to Create:**
- `src/core/event-bus/EventBus.test.ts`

---

### 4.5 Logger

**Current State:**
- 5 log levels
- File output
- Daily log files

**Target State:**
- Remove duplication in index.ts
- Add log rotation

**Stabilization Steps:**

1. **Remove duplicate logger in index.ts**
2. **Add basic log rotation (30 days)**
3. **Verify all modules use Logger**

**Files to Modify:**
- `src/services/logger/index.ts`

---

### 4.6 ConfigManager

**Current State:**
- File-based persistence
- Default values
- Basic validation

**Target State:**
- Async reads (future)
- Schema validation (future)

**Stabilization Steps:**

1. **No critical changes needed**
2. **Add Zod schema validation (Phase 2)**
3. **Add backup on save (future)**

---

## 5. IPC Stabilization

### 5.1 Channel Cleanup

**Current State:**
- 11 IPC modules
- Consistent naming convention
- No input validation

**Target State:**
- Validated inputs
- Rate limiting
- Audit logging

**Stabilization Steps:**

1. **Add Zod validation to critical handlers:**
   - profile:create (validate name)
   - trigger:create (validate structure)
   - connector:connect (validate config)
   - overlay:save (validate scene)

2. **Add rate limiting:**
   - Max 100 calls per minute per channel
   - Reject excess with error

3. **Add audit logging:**
   - Log sensitive operations
   - Track IPC call frequency

**Files to Modify:**
- `src/main/ipc/profile.ipc.ts`
- `src/main/ipc/trigger.ipc.ts`
- `src/main/ipc/connector.ipc.ts`
- `src/main/ipc/overlay.ipc.ts`

---

### 5.2 Preload Safety

**Current State:**
- All APIs exposed via window.maulfinity
- Context isolation enabled

**Target State:**
- Input validation in preload
- Type-safe API

**Stabilization Steps:**

1. **Keep current exposure (needed)**
2. **Add type guards in preload**
3. **Verify renderer cannot bypass**

**Files to Modify:**
- `src/preload/index.ts`

---

### 5.3 Renderer Isolation

**Current State:**
- Context isolation enabled
- No direct FS/DB access

**Target State:**
- Verified isolation
- No bypass possible

**Stabilization Steps:**

1. **Verify no nodeIntegration**
2. **Test renderer cannot access fs**
3. **Document security model**

---

## 6. Connector Stabilization

### 6.1 TikTok Connector

**Current State:**
- WebSocket connection
- Room ID scraping
- Event parsing

**Target State:**
- Stable connection
- Proper reconnection
- Error recovery

**Stabilization Steps:**

1. **Verify WebSocket connection works**
2. **Test reconnection on disconnect**
3. **Handle room ID fetch failures**
4. **Add connection timeout handling**

**Test Scenarios:**
- Connect to live room
- Receive gift events
- Handle disconnect
- Auto-reconnect

---

### 6.2 YouTube Connector

**Current State:**
- Polling API
- Live chat parsing
- Rate limiting

**Target State:**
- Stable polling
- Proper rate limit handling
- Error recovery

**Stabilization Steps:**

1. **Verify polling works**
2. **Test rate limit handling**
3. **Handle API key validation**
4. **Add error recovery**

**Test Scenarios:**
- Connect with valid API key
- Receive live chat messages
- Handle rate limits
- Handle invalid key

---

### 6.3 Connector Abstraction

**Current State:**
- BaseConnector abstract class
- ConnectionState machine
- Auto-reconnect

**Target State:**
- Stable abstraction
- Consistent behavior

**Stabilization Steps:**

1. **No changes needed**
2. **Write integration tests**
3. **Document extension points**

---

## 7. Overlay Runtime Stabilization

### 7.1 Rendering Separation

**Current State:**
- Editor: Visual editing in renderer
- Runtime: Separate overlay serving
- NOT connected

**Target State:**
- Editor and Runtime connected
- OBS can render overlays

**Stabilization Steps:**

1. **Wire OverlayRuntime to BrowserSourceServer**
2. **Verify HTML serving works**
3. **Test OBS browser source connection**
4. **Handle overlay updates**

**Files to Modify:**
- `src/overlay/runtime/OverlayRuntime.ts`
- `src/services/browser-source/BrowserSourceServer.ts`

---

### 7.2 Asset Loading

**Current State:**
- AssetLibrary for editor
- No runtime asset loading

**Target State:**
- Assets served via BrowserSourceServer
- Images, videos, fonts available

**Stabilization Steps:**

1. **Serve assets via HTTP**
2. **Verify OBS can access assets**
3. **Handle missing assets gracefully**

---

### 7.3 Runtime Lifecycle

**Current State:**
- OverlayRuntime exists
- startRendering/stopRendering

**Target State:**
- Stable lifecycle
- Proper cleanup

**Stabilization Steps:**

1. **Verify start/stop works**
2. **Test scene changes**
3. **Handle renderer crashes**
4. **Add cleanup on shutdown**

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Framework:** Vitest

**Coverage Targets:**

| Module | Target | Test File |
|--------|--------|-----------|
| EventBus | ≥80% | `EventBus.test.ts` |
| ServiceContainer | ≥80% | `ServiceContainer.test.ts` |
| ActionEngine | ≥70% | `ActionEngine.test.ts` |
| TriggerEngine | ≥70% | `TriggerEngine.test.ts` |
| ConfigManager | ≥80% | `ConfigManager.test.ts` |
| Logger | ≥80% | `Logger.test.ts` |

**Total Target:** ≥60% coverage on critical paths

---

### 8.2 Integration Tests

**Scenarios:**

| # | Scenario | Components | Priority |
|---|----------|------------|----------|
| 1 | TikTok → Trigger → Keyboard | Connector, EventBus, TriggerEngine, KeyboardAction | High |
| 2 | TikTok → Trigger → OBS | Connector, EventBus, TriggerEngine, OBSAction | High |
| 3 | YouTube → Trigger → Sound | Connector, EventBus, TriggerEngine, SoundAction | Medium |
| 4 | Trigger → Overlay | TriggerEngine, OverlayAction, OverlayRuntime | Medium |

---

### 8.3 Manual Validation

**Checklist:**

| # | Test Case | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1 | App startup | Opens without errors | ⬜ |
| 2 | TikTok connect | Connects to live room | ⬜ |
| 3 | YouTube connect | Connects to live chat | ⬜ |
| 4 | Create trigger | Trigger saved to DB | ⬜ |
| 5 | Trigger fires | Action executes on event | ⬜ |
| 6 | OBS connect | Connects to OBS WebSocket | ⬜ |
| 7 | OBS scene switch | Scene changes via trigger | ⬜ |
| 8 | Overlay displays | Overlay shows in OBS | ⬜ |
| 9 | Sound plays | Audio plays on trigger | ⬜ |
| 10 | TTS speaks | Text-to-speech works | ⬜ |

---

## 9. Alpha Release Criteria

### Architecture Criteria

| # | Criterion | Required | Status |
|---|-----------|----------|--------|
| A1 | Modular architecture maintained | ✅ | ⬜ |
| A2 | EventBus as central hub | ✅ | ⬜ |
| A3 | ServiceContainer functional | ✅ | ⬜ |
| A4 | All modules properly initialized | ✅ | ⬜ |
| A5 | Graceful shutdown implemented | ✅ | ⬜ |

---

### Performance Criteria

| # | Criterion | Required | Status |
|---|-----------|----------|--------|
| P1 | Startup time <1 second | ✅ | ⬜ |
| P2 | Memory usage <200MB idle | ✅ | ⬜ |
| P3 | Event processing <50ms | ✅ | ⬜ |
| P4 | No memory leaks (1 hour test) | ✅ | ⬜ |
| P5 | No console errors | ✅ | ⬜ |

---

### Security Criteria

| # | Criterion | Required | Status |
|---|-----------|----------|--------|
| S1 | IPC isolation enforced | ✅ | ⬜ |
| S2 | No direct FS access from renderer | ✅ | ⬜ |
| S3 | Input validation on critical handlers | ✅ | ⬜ |
| S4 | No critical security vulnerabilities | ✅ | ⬜ |
| S5 | Plugin permissions documented | ⚠️ | ⬜ |

---

### Functionality Criteria

| # | Criterion | Required | Status |
|---|-----------|----------|--------|
| F1 | TikTok connector works | ✅ | ⬜ |
| F2 | YouTube connector works | ✅ | ⬜ |
| F3 | Trigger creation works | ✅ | ⬜ |
| F4 | Trigger execution works | ✅ | ⬜ |
| F5 | OBS connection works | ✅ | ⬜ |
| F6 | OBS scene switching works | ✅ | ⬜ |
| F7 | Sound action works | ✅ | ⬜ |
| F8 | TTS action works | ✅ | ⬜ |
| F9 | Overlay displays in OBS | ⚠️ | ⬜ |
| F10 | Profile switching works | ✅ | ⬜ |

---

### Minimum for Alpha Build

**Must Pass:**
- A1-A5 (Architecture)
- P1-P3 (Performance)
- S1-S4 (Security)
- F1-F6 (Core Functionality)

**Nice to Have:**
- F7-F10 (Extended Functionality)
- P4-P5 (Optimization)
- S5 (Documentation)

---

## 10. Final Decision

### What Must Be Completed Before Alpha Build

| # | Requirement | Priority | Status |
|---|-------------|----------|--------|
| 1 | ApplicationCore wired in main | Critical | ⬜ |
| 2 | App starts without crashes | Critical | ⬜ |
| 3 | TypeScript compiles with 0 errors | Critical | ⬜ |
| 4 | Testing infrastructure added | Critical | ⬜ |
| 5 | EventBus unit tests written | Critical | ⬜ |
| 6 | ServiceContainer unit tests written | Critical | ⬜ |
| 7 | ActionEngine unit tests written | Critical | ⬜ |
| 8 | TikTok connector verified working | Critical | ⬜ |
| 9 | YouTube connector verified working | Critical | ⬜ |
| 10 | Trigger creation and execution works | High | ⬜ |
| 11 | OBS connection works | High | ⬜ |
| 12 | Placeholder actions implemented | High | ⬜ |
| 13 | Critical `any` types replaced | High | ⬜ |
| 14 | IPC input validation added | High | ⬜ |
| 15 | Manual testing checklist passed | Critical | ⬜ |

---

### Sprint 9 Success Definition

**Sprint 9 is complete when:**

1. ✅ All Critical tasks (1-9, 15) are done
2. ✅ All High priority tasks (10-14) are done
3. ✅ Alpha Release Criteria pass (minimum set)
4. ✅ No known critical bugs
5. ✅ Manual testing checklist passes

**Estimated Effort:** 60-80 hours (1.5-2 weeks)

---

### Recommended Sprint 9 Schedule

| Day | Tasks | Hours |
|-----|-------|-------|
| Day 1 | Wire ApplicationCore, Add Vitest | 6h |
| Day 2 | Write EventBus tests, ServiceContainer tests | 6h |
| Day 3 | Write ActionEngine tests, Replace `any` types | 8h |
| Day 4 | Replace console.log, Implement SoundAction | 6h |
| Day 5 | Implement TtsAction, Implement OverlayAction | 8h |
| Day 6 | Connect Overlay Runtime, Add IPC validation | 8h |
| Day 7 | Complete Trigger UI, Complete Automation UI | 8h |
| Day 8 | Runtime verification, Bug fixes | 6h |
| Day 9 | Manual testing, Documentation | 4h |
| Day 10 | Buffer for unexpected issues | 4h |
| **Total** | | **64h** |

---

**Document Status:** Final
**Last Updated:** July 24, 2026
**Next Review:** After Sprint 9 completion

---

**End of Sprint 9 Alpha Stabilization Plan**
