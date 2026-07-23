import { MaulfinityEvent } from '@core/event-bus/types'

// ============================================================
// AUTOMATION CONFIGURATION TYPES
// ============================================================

/**
 * Automation condition configuration
 * Supports various comparison operators and condition types
 */
export interface AutomationCondition {
  type: 'gift' | 'username' | 'value' | 'event' | 'random' | 'cooldown' | 'platform'
  operator?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'matches'
  value: unknown
  /** For cooldown type: cooldown duration in seconds */
  cooldownSeconds?: number
  /** For random type: probability 0-100 */
  probability?: number
}

/**
 * Automation action configuration
 */
export interface AutomationAction {
  type: string
  config: Record<string, unknown>
  /** Execution order (lower = earlier) */
  order?: number
  /** Delay before executing this action (ms) */
  delay?: number
}

/**
 * Complete automation configuration
 */
export interface AutomationConfig {
  id: string
  profileId: string
  name: string
  description?: string
  type: 'simple' | 'advanced'
  enabled: boolean
  /** Event type to match (e.g., 'gift', 'comment', 'follow') */
  eventType: string
  /** Conditions that must be met */
  conditions: AutomationCondition[]
  /** Actions to execute */
  actions: AutomationAction[]
  /** Cooldown between executions (seconds) */
  cooldown?: number
  /** Maximum executions per session */
  maxExecutions?: number
  createdAt: string
  updatedAt: string
}

// ============================================================
// EXECUTION CONTEXT TYPES
// ============================================================

/**
 * Variables store for automation execution
 */
export interface VariableStore {
  get(name: string): unknown
  set(name: string, value: unknown): void
  has(name: string): boolean
  getAll(): Record<string, unknown>
}

/**
 * Counter store for tracking counts across events
 */
export interface CounterStore {
  get(name: string): number
  increment(name: string, amount?: number): number
  decrement(name: string, amount?: number): number
  reset(name: string): void
  getAll(): Record<string, number>
}

/**
 * Cooldown store for tracking execution cooldowns
 */
export interface CooldownStore {
  isOnCooldown(key: string): boolean
  setCooldown(key: string, durationSeconds: number): void
  getRemainingCooldown(key: string): number
  clear(key: string): void
}

/**
 * Execution context passed to automation actions
 */
export interface ExecutionContext {
  /** The triggering event */
  event: MaulfinityEvent
  /** The automation being executed */
  automation: AutomationConfig
  /** Unique execution ID */
  executionId: string
  /** Timestamp of execution */
  timestamp: number
  /** Access to variables */
  variables: VariableStore
  /** Access to counters */
  counters: CounterStore
  /** Access to cooldowns */
  cooldowns: CooldownStore
  /** Logger for this execution */
  logger: AutomationLogger
}

/**
 * Logger interface for automation execution
 */
export interface AutomationLogger {
  info(message: string): void
  warning(message: string): void
  error(message: string, error?: Error): void
  debug(message: string): void
}

// ============================================================
// AUTOMATION EXECUTION TYPES
// ============================================================

/**
 * Status of an automation execution
 */
export type AutomationExecutionStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'cooldown'

/**
 * Result of executing a single action
 */
export interface ActionResult {
  actionType: string
  success: boolean
  duration: number
  error?: string
}

/**
 * Result of an automation execution
 */
export interface AutomationExecutionResult {
  executionId: string
  automationId: string
  status: AutomationExecutionStatus
  eventId: string
  startedAt: number
  completedAt?: number
  duration?: number
  actionResults: ActionResult[]
  error?: string
}

/**
 * Execution history entry
 */
export interface AutomationExecutionHistory {
  id: string
  automationId: string
  eventId: string
  status: AutomationExecutionStatus
  startedAt: string
  completedAt?: string
  durationMs?: number
  actionResults?: string
  errorMessage?: string
}

// ============================================================
// AUTOMATION MANAGER TYPES
// ============================================================

/**
 * Filter for listing automations
 */
export interface AutomationFilter {
  profileId?: string
  enabled?: boolean
  eventType?: string
  type?: 'simple' | 'advanced'
}

/**
 * Statistics for automation system
 */
export interface AutomationStats {
  totalAutomations: number
  enabledAutomations: number
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
}
