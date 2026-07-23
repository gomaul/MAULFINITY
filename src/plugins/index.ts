/**
 * Plugin SDK Module
 * 
 * Module exports for the plugin system.
 * 
 * Architecture:
 *   External Plugin → Plugin SDK API → Plugin Manager → Core Systems
 */

// Core classes
export { PluginManager } from './PluginManager'
export { PluginRegistry } from './PluginRegistry'
export { PluginValidator } from './PluginValidator'
export { PluginPermissionManager } from './PluginPermissionManager'
export { PluginStorage } from './PluginStorage'
export { PluginSandbox } from './PluginSandbox'

// Types
export * from './types'
