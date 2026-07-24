# MAULFINITY — ALPHA REFACTOR PLAN

> **Version:** 1.0
> **Date:** July 24, 2026
> **Author:** Buffy (AI Development Assistant)
> **Status:** Planning Phase (No Implementation)
> **Prerequisite:** docs/16_ALPHA_ARCHITECTURE_AUDIT.md

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Critical Issues](#2-critical-issues)
3. [Core Architecture Improvements](#3-core-architecture-improvements)
4. [Event System Refactor Plan](#4-event-system-refactor-plan)
5. [IPC Hardening Plan](#5-ipc-hardening-plan)
6. [Plugin System Preparation](#6-plugin-system-preparation)
7. [Database Improvement Plan](#7-database-improvement-plan)
8. [Performance Optimization Plan](#8-performance-optimization-plan)
9. [Refactor Execution Order](#9-refactor-execution-order)
10. [Risk Management](#10-risk-management)
11. [Testing Requirements](#11-testing-requirements)
12. [Final Recommendation](#12-final-recommendation)

---

## 1. Executive Summary

### 1.1 Current Architecture Condition

Maulfinity has a **solid modular architecture** (82/100) but faces critical gaps in testing, type safety, and production readiness (55/100). The event-driven design via EventBus is well-implemented, but several subsystems have incomplete implementations and security vulnerabilities.

| Area | Condition | Risk Level |
|------|-----------|------------|
| Core Engine | Good | Low |
| Connector Engine | Good | Low |
| Automation System | Good | Low |
| Plugin System | Incomplete | High |
| Overlay System | Incomplete | High |
| Testing | Non-existent | Critical |
| Type Safety | Compromised | High |
| Security | Vulnerable | High |

### 1.2 Main Risks

| # | Risk | Severity | Impact |
|---|------|----------|--------|
| R-01 | No testing infrastructure | Critical | Cannot verify any changes |
| R-02 | Plugin system has no sandbox | High | Security vulnerability |
| R-03 | ApplicationCore not wired in main | Critical | App may not start |
| R-04 | 40+ `any` types | High | Runtime errors possible |
| R-05 | Placeholder actions | Medium | Features incomplete |

### 1.3 Refactor Objective

**Primary Goal:** Transform Maulfinity from Pre-Alpha (66/100) to Alpha Ready (75+/100) within 4 weeks.

**Success Criteria:**
- ✅ Application starts and runs without crashes
- ✅ All critical bugs resolved
- ✅ Unit test coverage ≥60% for core engines
- ✅ No `any` types in critical paths
- ✅ Plugin sandbox implemented
- ✅ All placeholder actions functional

---

## 2. Critical Issues

### Issue 1: ApplicationCore Not Wired in Main

| Field | Value |
|-------|-------|
| **Issue** | ApplicationCore.start() not called in main/index.ts |
| **Location** | `src/main/index.ts` |
| **Affected System** | Application Startup |
| **Risk** | Application may not initialize properly; engines may not start |
| **Required Change** | Import and call ApplicationCore.start() in bootstrap function |
| **Estimated Complexity** | Low (1-2 hours) |
| **Dependencies** | None |
| **Priority** | **Critical** |

**Current State:**
```typescript
// main/index.ts
const bootstrap = async () => {
  // ApplicationCore not initialized
  createWindow()
}
```

**Target State:**
```typescript
// main/index.ts
import { ApplicationCore } from '@core/application/ApplicationCore'

const bootstrap = async () => {
  const appCore = ApplicationCore.getInstance()
  await appCore.start()
  createWindow()
}
```

---

### Issue 2: No Testing Infrastructure

| Field | Value |
|-------|-------|
| **Issue** | No unit tests, integration tests, or E2E tests exist |
| **Location** | Project-wide |
| **Affected System** | All Systems |
| **Risk** | Cannot verify correctness; regressions undetected |
| **Required Change** | Add Vitest, write unit tests for core engines |
| **Estimated Complexity** | High (20-30 hours) |
| **Dependencies** | None |
| **Priority** | **Critical** |

**Required Setup:**
1. Install Vitest + @vitest/coverage-v8
2. Create vitest.config.ts
3. Write tests for EventBus, ServiceContainer, ActionEngine
4. Achieve ≥60% coverage on critical paths

---

### Issue 3: Plugin SDK Stubs

| Field | Value |
|-------|-------|
| **Issue** | PluginSDK methods are stubs (log only, no real functionality) |
| **Location** | `src/plugins/PluginManager.ts` (createSDK method) |
| **Affected System** | Plugin System |
| **Risk** | Plugins cannot register actions, nodes, or connectors |
| **Required Change** | Implement real SDK methods that delegate to ActionEngine, GraphManager, ConnectorManager |
| **Estimated Complexity** | High (15-20 hours) |
| **Dependencies** | None |
| **Priority** | **High** |

**Affected SDK Methods:**
- `actions.register()` → Must register with ActionEngine
- `actions.unregister()` → Must unregister from ActionEngine
- `graph.registerNode()` → Must register with NodeManager
- `connectors.register()` → Must register with ConnectorRegistry
- `ui.addMenuItem()` → Must update sidebar state

---

### Issue 4: No Plugin Sandboxing

| Field | Value |
|-------|-------|
| **Issue** | Plugins run in main process with full access |
| **Location** | `src/plugins/` |
| **Affected System** | Plugin System, Security |
| **Risk** | Malicious plugins can access file system, database, network |
| **Required Change** | Implement VM2 or Worker-based sandbox |
| **Estimated Complexity** | High (25-30 hours) |
| **Dependencies** | PluginSDK implementation |
| **Priority** | **High** |

**Sandbox Requirements:**
- Isolated execution context
- Controlled API access via permission system
- Resource limits (CPU, memory)
- Error isolation

---

### Issue 5: Excessive `any` Types

| Field | Value |
|-------|-------|
| **Issue** | 40+ instances of `any` type throughout codebase |
| **Location** | PluginSDK.ts (9), PluginManager.ts (3), Renderer pages (10+) |
| **Affected System** | Type Safety, Runtime Stability |
| **Risk** | Runtime errors, lost type information |
| **Required Change** | Replace all `any` with proper TypeScript interfaces |
| **Estimated Complexity** | Medium (8-12 hours) |
| **Dependencies** | None |
| **Priority** | **High** |

**Critical Files:**
| File | `any` Count | Priority |
|------|-------------|----------|
| PluginSDK.ts | 9 | High |
| PluginManager.ts | 3 | High |
| Triggers.tsx | 2 | Medium |
| Profiles.tsx | 3 | Medium |
| Assets.tsx | 2 | Medium |

---

### Issue 6: Placeholder Actions

| Field | Value |
|-------|-------|
| **Issue** | TtsAction, OverlayAction, SoundAction are placeholders |
| **Location** | `src/core/action-engine/actions/` |
| **Affected System** | Action Engine, Automation |
| **Risk** | Core features non-functional |
| **Required Change** | Implement basic functionality or throw clear "not implemented" errors |
| **Estimated Complexity** | Medium (10-15 hours) |
| **Dependencies** | OBS Service, Overlay Runtime |
| **Priority** | **High** |

**Actions to Implement:**
| Action | Minimum Implementation |
|--------|------------------------|
| SoundAction | Use HTML5 Audio or node speaker |
| TtsAction | Use system TTS or external API |
| OverlayAction | Trigger overlay via OverlayRuntime |

---

### Issue 7: Console.log Usage

| Field | Value |
|-------|-------|
| **Issue** | 67 instances of console.log/error instead of Logger |
| **Location** | Throughout codebase (Renderer: 40+, IPC: 10, Main: 5) |
| **Affected System** | Logging, Debugging |
| **Risk** | Inconsistent logging, no file output for renderer errors |
| **Required Change** | Replace all console.log with Logger or remove |
| **Estimated Complexity** | Low (4-6 hours) |
| **Dependencies** | None |
| **Priority** | **Medium** |

---

### Issue 8: Overlay Runtime Not Connected

| Field | Value |
|-------|-------|
| **Issue** | OverlayRuntime not connected to BrowserSourceServer |
| **Location** | `src/overlay/runtime/OverlayRuntime.ts`, `src/services/browser-source/` |
| **Affected System** | Overlay System |
| **Risk** | Overlays cannot be rendered in OBS |
| **Required Change** | Wire OverlayRuntime to BrowserSourceServer |
| **Estimated Complexity** | Medium (8-10 hours) |
| **Dependencies** | BrowserSourceServer |
| **Priority** | **High** |

---

### Issue 9: IPC No Input Validation

| Field | Value |
|-------|-------|
| **Issue** | IPC handlers lack input validation |
| **Location** | `src/main/ipc/` |
| **Affected System** | IPC, Security |
| **Risk** | Invalid data can crash main process |
| **Required Change** | Add Zod validation to all IPC handlers |
| **Estimated Complexity** | Medium (8-10 hours) |
| **Dependencies** | Zod (already installed) |
| **Priority** | **High** |

---

### Issue 10: Trigger/Automation UI Incomplete

| Field | Value |
|-------|-------|
| **Issue** | Trigger and Automation pages have TODO stubs |
| **Location** | `src/renderer/pages/Triggers.tsx`, `Automation.tsx` |
| **Affected System** | UI, User Experience |
| **Risk** | Users cannot create or manage triggers |
| **Required Change** | Complete UI implementation with CRUD operations |
| **Estimated Complexity** | High (15-20 hours) |
| **Dependencies** | IPC handlers for triggers |
| **Priority** | **Medium** |

---

## 3. Core Architecture Improvements

### 3.1 ApplicationCore

| Aspect | Current State | Target State |
|--------|---------------|--------------|
| Initialization | Manual singleton calls | ServiceContainer-driven |
| Dependencies | Direct imports (16 modules) | Lazy-loaded via container |
| Error Handling | try/catch with throw | Graceful degradation |
| Status Reporting | Basic status enum | Detailed health checks |

**Migration Steps:**

1. **Phase 1:** Wire ApplicationCore.start() in main/index.ts
2. **Phase 2:** Move engine registration to ServiceContainer
3. **Phase 3:** Add lazy loading for non-critical modules
4. **Phase 4:** Add health check endpoints

**Files to Modify:**
- `src/main/index.ts` - Add ApplicationCore.start()
- `src/core/application/ApplicationCore.ts` - Refactor initialization

---

### 3.2 ServiceContainer

| Aspect | Current State | Target State |
|--------|---------------|--------------|
| Usage | 15 services registered | All 25+ modules registered |
| Resolution | Async resolve() | Sync resolveSync() for singletons |
| Dependency Injection | Not used | Constructor injection where possible |

**Migration Steps:**

1. **Phase 1:** Register all singletons in ServiceContainer
2. **Phase 2:** Replace direct getInstance() calls with container.resolve()
3. **Phase 3:** Add dependency injection to key classes

**Priority Registrations:**
| Service | Current Access | Target Access |
|---------|----------------|---------------|
| EventBus | EventBus.getInstance() | container.resolve('eventBus') |
| ActionEngine | ActionEngine.getInstance() | container.resolve('actionEngine') |
| ConnectorManager | ConnectorManager.getInstance() | container.resolve('connectorManager') |
| GameManager | GameManager.getInstance() | container.resolve('gameManager') |
| PluginManager | PluginManager.getInstance() | container.resolve('pluginManager') |

---

### 3.3 ModuleManager

| Aspect | Current State | Target State |
|--------|---------------|--------------|
| Registration | Manual register() calls | Auto-discovery |
| Dependencies | Explicit dependency array | Inferred from imports |
| Error Recovery | Stop on error | Continue with degraded mode |

**Migration Steps:**

1. **Phase 1:** Keep current implementation (works well)
2. **Phase 2:** Add optional auto-discovery feature
3. **Phase 3:** Add health monitoring per module

---

### 3.4 ConfigManager

| Aspect | Current State | Target State |
|--------|---------------|--------------|
| File Access | Synchronous reads | Async reads |
| Validation | Basic checks | Schema-based validation |
| Backup | None | Automatic backups |

**Migration Steps:**

1. **Phase 1:** Replace readFileSync with async readFileSync (low priority)
2. **Phase 2:** Add Zod schema validation
3. **Phase 3:** Add backup on save

---

### 3.5 Logger

| Aspect | Current State | Target State |
|--------|---------------|--------------|
| Log Rotation | None | Daily rotation, 30-day retention |
| Duplication | index.ts duplicates Logger.ts | Single source |
| Levels | 5 levels | 5 levels + custom |

**Migration Steps:**

1. **Phase 1:** Remove duplicate logger in index.ts
2. **Phase 2:** Add log rotation logic
3. **Phase 3:** Add structured logging (JSON format option)

---

### 3.6 EventBus

| Aspect | Current State | Target State |
|--------|---------------|--------------|
| Prioritization | None | Priority queue support |
| Middleware | None | Pre/post processing hooks |
| Persistence | In-memory only | Optional file persistence |

**Migration Steps:**

1. **Phase 1:** Keep current implementation (works well)
2. **Phase 2:** Add optional middleware support
3. **Phase 3:** Add optional persistence for critical events

---

## 4. Event System Refactor Plan

### 4.1 Event Naming Consistency

**Current Convention:** `{category}` or `{category}.{subcategory}`

**Recommended Standard:**
```
{source}.{category}.{action}
```

**Examples:**
| Current | Recommended | Notes |
|---------|-------------|-------|
| `gift` | `tiktok.gift.received` | Add source prefix |
| `comment` | `youtube.comment.posted` | Add source prefix |
| `follow` | `tiktok.follow.new` | Add source prefix |

**Migration Strategy:**
- Keep backward compatibility during transition
- Support both old and new formats
- Gradually migrate listeners to new format

---

### 4.2 Event Ownership

**Current State:** Events owned by emiters (connectors, adapters)

**Target State:** Clear ownership model

| Event Category | Owner | Consumers |
|----------------|-------|-----------|
| Platform Events | Connectors | TriggerEngine, AutomationEngine, Logger |
| Game Events | GameManager | TriggerEngine, AutomationEngine |
| System Events | ApplicationCore | All modules |
| Plugin Events | PluginManager | EventBus subscribers |

---

### 4.3 Event Lifecycle

**Current State:** Fire-and-forget

**Target State:** Tracked lifecycle

```
Event Created
    │
    ▼
Event Emitted
    │
    ├──► Listeners Notified
    │        │
    │        ▼
    │    Handler Executed
    │        │
    │        ▼
    │    Handler Completed
    │
    ▼
Event Archived (optional)
```

**Additions:**
- Event ID tracking
- Execution time monitoring
- Dead letter queue for failed events

---

### 4.4 Error Propagation

**Current State:** Errors caught and logged, execution continues

**Target State:** Configurable error handling

| Strategy | Use Case |
|----------|----------|
| Log and Continue | Most events (current) |
| Log and Retry | Critical events (gifts, payments) |
| Log and Alert | System errors |
| Log and Stop | Fatal errors |

---

## 5. IPC Hardening Plan

### 5.1 IPC Channel Security

**Current State:** Basic channel registration

**Target State:** Validated, rate-limited channels

| Improvement | Priority | Effort |
|-------------|----------|--------|
| Input validation (Zod) | High | Medium |
| Rate limiting | Medium | Low |
| Audit logging | Medium | Low |
| Channel whitelisting | Low | Low |

---

### 5.2 Preload Exposure

**Current State:** All APIs exposed via window.maulfinity

**Target State:** Minimal exposure, permission-based

**Current Exposure:**
```typescript
window.maulfinity = {
  profile: { list, get, create, update, delete },
  trigger: { list, create, update, delete, test },
  asset: { list, import, delete, scan },
  connector: { connect, disconnect, status, allStatus, list, getEventHistory },
  overlay: { list, save, preview },
  plugin: { list, install, disable, remove },
  game: { list, register, connect, disconnect, ... },
  graph: { list, get, create, update, delete, save, load, ... },
  obs: { connect, disconnect, getStatus, getScenes, ... },
  settings: { get, set, getAll },
  system: { getVersion, getStatus, restart }
}
```

**Recommended Reduction:**
- Keep all APIs (needed for functionality)
- Add input validation to each handler
- Add audit logging for sensitive operations

---

### 5.3 Security Boundaries

**Current Boundaries:**
| Boundary | Status | Risk |
|----------|--------|------|
| Renderer ↔ Main | ✅ Enforced | Low |
| Plugin ↔ Core | ❌ Not Enforced | High |
| External ↔ Main | ⚠️ Partial | Medium |

**Required Additions:**
1. Plugin sandbox (see Section 6)
2. External connection validation
3. Input sanitization

---

## 6. Plugin System Preparation

### 6.1 Plugin Lifecycle Preparation

**Current State:** Basic lifecycle (install→load→enable→disable)

**Target State:** Robust lifecycle with error recovery

| Phase | Current | Target |
|-------|---------|--------|
| Install | ✅ | ✅ + Validation |
| Load | ⚠️ Dynamic import | ✅ + Sandboxed import |
| Enable | ⚠️ Stub SDK | ✅ + Real SDK |
| Active | ⚠️ No monitoring | ✅ + Health checks |
| Disable | ✅ | ✅ + Cleanup verification |
| Uninstall | ✅ | ✅ + Resource cleanup |

---

### 6.2 Plugin Manifest Preparation

**Current State:** Basic manifest validation

**Target State:** Comprehensive manifest

```json
{
  "$schema": "https://maulfinity.dev/plugin-schema.json",
  "id": "com.author.plugin",
  "name": "Plugin Name",
  "version": "1.0.0",
  "description": "Description",
  "author": "Author",
  "type": "connector|action|node|game|widget",
  "main": "dist/index.js",
  "engines": {
    "maulfinity": ">=0.9.0"
  },
  "permissions": [
    "event-bus:read",
    "event-bus:write",
    "action-engine:register"
  ],
  "config": {
    "apiKey": {
      "type": "string",
      "required": true,
      "label": "API Key"
    }
  }
}
```

---

### 6.3 Permission System Preparation

**Current State:** Basic permission checking

**Target State:** Granular permission system

| Permission | Description | Risk Level |
|------------|-------------|------------|
| `event-bus:read` | Subscribe to events | Low |
| `event-bus:write` | Emit events | Medium |
| `action-engine:register` | Register actions | Medium |
| `graph-engine:register-node` | Register nodes | Medium |
| `connector:register` | Register connectors | Medium |
| `game:register-adapter` | Register adapters | Medium |
| `overlay:create` | Create overlays | Medium |
| `database:read` | Read database | High |
| `database:write` | Write database | High |
| `network:http` | HTTP requests | High |
| `filesystem:read` | Read files | High |
| `filesystem:write` | Write files | High |

---

### 6.4 Isolation Preparation

**Current State:** No isolation (plugins run in main process)

**Target State:** Sandboxed execution

**Sandbox Options:**

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| VM2 | Simple, fast | Security issues reported | ⚠️ Use with caution |
| Worker Threads | True isolation | Complex API | ✅ Recommended |
| Web Workers | Browser-compatible | Limited Node.js access | ⚠️ For renderer only |
| Child Process | Full isolation | High overhead | ❌ Overkill |

**Recommended Approach:** Worker Threads for main process plugins

---

## 7. Database Improvement Plan

### 7.1 Schema Improvements

| Current Issue | Recommended Fix | Priority |
|---------------|-----------------|----------|
| No foreign keys | Add FOREIGN KEY constraints | Medium |
| No indexes | Add indexes on frequently queried columns | Low |
| No cascading deletes | Add ON DELETE CASCADE | Medium |

**Indexes to Add:**
```sql
-- Events table
CREATE INDEX idx_events_platform ON events(platform);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_created_at ON events(created_at);

-- Triggers table
CREATE INDEX idx_triggers_profile_id ON triggers(profile_id);
CREATE INDEX idx_triggers_enabled ON triggers(enabled);

-- Automations table
CREATE INDEX idx_automations_profile_id ON automations(profile_id);
CREATE INDEX idx_automations_enabled ON automations(enabled);
```

---

### 7.2 Migration Strategy Improvements

**Current State:** Sequential migrations

**Target State:** Versioned, testable migrations

| Improvement | Description |
|-------------|-------------|
| Version tracking | Store migration version in database |
| Rollback support | Add down() functions to migrations |
| Test migrations | Add migration tests |
| Backup before migration | Auto-backup before running |

---

### 7.3 Future Scalability

**Current Limitations:**
- SQLite single-writer
- No connection pooling
- No read replicas

**Future Considerations:**
| Need | Solution | When |
|------|----------|------|
| Concurrent writes | WAL mode | Now |
| Large datasets | Pagination | Now |
| Cloud sync | Optional PostgreSQL | v2.0 |
| Analytics | Separate read database | v2.0 |

---

## 8. Performance Optimization Plan

### 8.1 Electron Startup

**Current State:** ~900ms estimated

**Target State:** <500ms

| Optimization | Expected Improvement |
|--------------|---------------------|
| Lazy module loading | -100ms |
| Deferred plugin loading | -50ms |
| Preload optimization | -50ms |
| V8 snapshot | -100ms |

---

### 8.2 Memory Usage

**Current State:** ~165MB idle

**Target State:** <150MB idle

| Optimization | Expected Improvement |
|--------------|---------------------|
| Event history limit | -5MB |
| Plugin memory limits | -10MB |
| Renderer optimization | -10MB |

---

### 8.3 Background Services

**Current State:** All services start on boot

**Target State:** Lazy start, on-demand

| Service | Current | Recommended |
|---------|---------|-------------|
| TikTok Connector | Auto-start | On-demand |
| YouTube Connector | Auto-start | On-demand |
| OBS Service | Auto-start | On-demand |
| Game Manager | Auto-start | On-demand |
| Plugin System | Auto-start | On-demand |

---

### 8.4 Event Processing

**Current State:** <10ms emission, <5ms notification

**Target State:** Maintain current performance

**Monitoring:**
- Add event processing metrics
- Track listener execution time
- Alert on slow handlers (>100ms)

---

## 9. Refactor Execution Order

### Phase 1: Critical Fixes (Week 1)

**Objective:** Make the application start and run reliably

| # | Task | Effort | Dependencies |
|---|------|--------|--------------|
| 1.1 | Wire ApplicationCore.start() in main/index.ts | 2h | None |
| 1.2 | Fix ApplicationCore initialization order | 4h | 1.1 |
| 1.3 | Add Vitest testing infrastructure | 4h | None |
| 1.4 | Write unit tests for EventBus | 4h | 1.3 |
| 1.5 | Write unit tests for ServiceContainer | 2h | 1.3 |
| 1.6 | Write unit tests for ActionEngine | 4h | 1.3 |
| 1.7 | Replace critical `any` types | 6h | None |
| 1.8 | Runtime verification | 4h | 1.1-1.7 |

**Exit Criteria:**
- ✅ Application starts without errors
- ✅ TypeScript compiles with 0 errors
- ✅ Unit tests pass for core engines
- ✅ No `any` types in core modules

---

### Phase 2: Architecture Improvements (Week 2)

**Objective:** Improve code quality and maintainability

| # | Task | Effort | Dependencies |
|---|------|--------|--------------|
| 2.1 | Register all singletons in ServiceContainer | 4h | Phase 1 |
| 2.2 | Replace console.log with Logger | 4h | None |
| 2.3 | Implement placeholder actions (Sound, TTS) | 8h | None |
| 2.4 | Complete Trigger UI page | 8h | None |
| 2.5 | Complete Automation UI page | 8h | None |
| 2.6 | Add IPC input validation (Zod) | 6h | None |

**Exit Criteria:**
- ✅ All singletons accessible via ServiceContainer
- ✅ No console.log in production code
- ✅ Actions execute without errors
- ✅ Trigger/Automation UI functional

---

### Phase 3: Security Improvements (Week 3)

**Objective:** Address security vulnerabilities

| # | Task | Effort | Dependencies |
|---|------|--------|--------------|
| 3.1 | Implement PluginSDK real methods | 12h | Phase 2 |
| 3.2 | Implement plugin sandbox (Worker) | 16h | 3.1 |
| 3.3 | Add permission system enforcement | 6h | 3.2 |
| 3.4 | Add IPC rate limiting | 4h | None |
| 3.5 | Connect OverlayRuntime to BrowserSourceServer | 8h | None |

**Exit Criteria:**
- ✅ Plugins execute in sandbox
- ✅ Permissions enforced
- ✅ Rate limiting active
- ✅ Overlays render in OBS

---

### Phase 4: Performance Improvements (Week 4)

**Objective:** Optimize performance and polish

| # | Task | Effort | Dependencies |
|---|------|--------|--------------|
| 4.1 | Add lazy module loading | 6h | Phase 3 |
| 4.2 | Optimize startup time | 4h | 4.1 |
| 4.3 | Add performance monitoring | 4h | None |
| 4.4 | Add database indexes | 2h | None |
| 4.5 | Add log rotation | 2h | None |
| 4.6 | Final testing and bug fixes | 8h | All |

**Exit Criteria:**
- ✅ Startup time <500ms
- ✅ Memory usage <150MB idle
- ✅ All tests pass
- ✅ No known critical bugs

---

## 10. Risk Management

| Change | Risk | Impact | Mitigation |
|--------|------|--------|------------|
| Wire ApplicationCore | Medium | High | Test startup flow thoroughly |
| Add testing infrastructure | Low | High | Minimal risk, additive |
| Replace `any` types | Medium | Medium | Type errors caught at compile time |
| Implement plugin sandbox | High | High | Extensive security testing |
| IPC input validation | Low | Medium | Additive, no breaking changes |
| Placeholder action implementation | Medium | Medium | Test each action independently |
| Overlay runtime connection | Medium | High | Test with OBS |
| Database schema changes | Medium | High | Backup before migration |

---

## 11. Testing Requirements

### 11.1 Unit Tests

| Module | Test Files | Coverage Target |
|--------|------------|-----------------|
| EventBus | EventBus.test.ts | ≥80% |
| ServiceContainer | ServiceContainer.test.ts | ≥80% |
| ActionEngine | ActionEngine.test.ts | ≥70% |
| TriggerEngine | TriggerEngine.test.ts | ≥70% |
| ConnectorManager | ConnectorManager.test.ts | ≥60% |
| ConfigManager | ConfigManager.test.ts | ≥80% |
| Logger | Logger.test.ts | ≥80% |

**Total Target:** ≥60% coverage on critical paths

---

### 11.2 Integration Tests

| Scenario | Components | Priority |
|----------|------------|----------|
| TikTok → Trigger → Keyboard | Connector, EventBus, TriggerEngine, ActionEngine | High |
| TikTok → Trigger → OBS | Connector, EventBus, TriggerEngine, OBSAction | High |
| YouTube → Trigger → Sound | Connector, EventBus, TriggerEngine, SoundAction | Medium |
| Plugin → EventBus → Action | PluginSDK, EventBus, ActionEngine | Medium |
| Game → EventBus → Automation | GameManager, EventBus, AutomationEngine | Medium |

---

### 11.3 Manual Testing

| Test Case | Description | Priority |
|-----------|-------------|----------|
| App Startup | Application starts without errors | Critical |
| TikTok Connect | Connect to TikTok LIVE | Critical |
| YouTube Connect | Connect to YouTube LIVE | Critical |
| Trigger Create | Create a trigger via UI | High |
| Trigger Execute | Trigger fires on event | High |
| OBS Connect | Connect to OBS | High |
| OBS Scene Switch | Switch scenes via trigger | High |
| Overlay Display | Overlay shows in OBS | High |
| Plugin Install | Install a plugin | Medium |
| Game Connect | Connect to a game adapter | Medium |

---

## 12. Final Recommendation

### Is Maulfinity Ready for Alpha?

**Answer: NO**

Maulfinity is **NOT ready for Alpha testing** in its current state.

---

### What Must Happen First

| # | Requirement | Status | Must Complete |
|---|-------------|--------|---------------|
| 1 | Application starts reliably | ❌ Not verified | Yes |
| 2 | Core engines functional | ⚠️ Partially | Yes |
| 3 | Testing infrastructure | ❌ Not exists | Yes |
| 4 | Critical bugs resolved | ❌ Not tested | Yes |
| 5 | Type safety | ⚠️ 40+ `any` types | Yes |

---

### Alpha Readiness Checklist

| # | Criterion | Required | Status |
|---|-----------|----------|--------|
| 1 | Application starts without crashes | ✅ | ⬜ |
| 2 | TypeScript compiles with 0 errors | ✅ | ⬜ |
| 3 | Unit tests exist for core engines | ✅ | ⬜ |
| 4 | TikTok connector works | ✅ | ⬜ |
| 5 | YouTube connector works | ✅ | ⬜ |
| 6 | Trigger creation works | ✅ | ⬜ |
| 7 | Trigger execution works | ✅ | ⬜ |
| 8 | OBS connection works | ✅ | ⬜ |
| 9 | Overlay displays in OBS | ⚠️ | ⬜ |
| 10 | No critical security vulnerabilities | ✅ | ⬜ |

**Minimum for Alpha:** Criteria 1-7, 10 must pass

---

### Recommended Path Forward

```
Current State (Pre-Alpha)
    │
    ▼
Phase 1: Critical Fixes (Week 1)
    │
    ▼
Phase 2: Architecture Improvements (Week 2)
    │
    ▼
Alpha Readiness Check
    │
    ├──► Pass ──► Alpha Testing
    │
    └──► Fail ──► Continue Phase 3
                      │
                      ▼
                  Phase 3: Security (Week 3)
                      │
                      ▼
                  Phase 4: Performance (Week 4)
                      │
                      ▼
                  Beta Readiness Check
```

---

### Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | Week 1 | Critical Fixes |
| Phase 2 | Week 2 | Architecture |
| Phase 3 | Week 3 | Security |
| Phase 4 | Week 4 | Performance |
| **Total** | **4 weeks** | **Alpha Ready** |

---

**Document Status:** Final
**Last Updated:** July 24, 2026
**Next Review:** After Phase 1 completion

---

**End of Alpha Refactor Plan**
