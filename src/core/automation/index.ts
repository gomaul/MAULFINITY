// Core engine
export { AutomationEngine } from './AutomationEngine'
export { AutomationManager } from './AutomationManager'
export { AutomationExecutor } from './AutomationExecutor'

// Conditions
export { ConditionEvaluator } from './conditions/ConditionEvaluator'

// Simple Trigger Compatibility
export { SimpleTriggerConverter } from './simple-trigger/SimpleTriggerConverter'

// Types
export type {
  AutomationConfig,
  AutomationCondition,
  AutomationAction,
  ExecutionContext,
  VariableStore,
  CounterStore,
  CooldownStore,
  AutomationExecutionResult,
  AutomationExecutionHistory,
  AutomationFilter,
  AutomationStats,
  ActionResult,
  AutomationLogger
} from './types'
