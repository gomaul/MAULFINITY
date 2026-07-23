import { Logger } from '@services/logger'
import { Plugin, PluginPermission } from './types'

const logger = new Logger('PluginSandbox')

/**
 * PluginSandbox - Enforces isolation and security for plugins
 * 
 * Plugins run in a sandboxed environment with limited access.
 * All API calls go through the sandbox which checks permissions.
 */
export class PluginSandbox {
  /** Rate limiting */
  private rateLimits: Map<string, { count: number; resetAt: number }> = new Map()

  /** Blocked operations */
  private blockedOps: Set<string> = new Set()

  constructor() {
    // Block dangerous operations
    this.blockedOps.add('eval')
    this.blockedOps.add('Function')
    this.blockedOps.add('require')
  }

  /**
   * Check if a plugin can perform an operation
   */
  canPerform(plugin: Plugin, operation: string, permission?: PluginPermission): boolean {
    // Check if operation is blocked
    if (this.blockedOps.has(operation)) {
      logger.warning(`[${plugin.manifest.id}] Blocked operation: ${operation}`)
      return false
    }

    // Check rate limit
    if (this.isRateLimited(plugin.manifest.id)) {
      logger.warning(`[${plugin.manifest.id}] Rate limited`)
      return false
    }

    // Check permission if required
    if (permission && !plugin.grantedPermissions.includes(permission)) {
      logger.warning(`[${plugin.manifest.id}] Permission denied: ${permission}`)
      return false
    }

    return true
  }

  /**
   * Execute an operation in sandbox
   */
  async execute<T>(
    plugin: Plugin,
    operation: string,
    permission: PluginPermission | undefined,
    fn: () => Promise<T> | T
  ): Promise<T> {
    if (!this.canPerform(plugin, operation, permission)) {
      throw new Error(`Operation not permitted: ${operation}`)
    }

    // Update rate limit
    this.updateRateLimit(plugin.manifest.id)

    try {
      return await fn()
    } catch (error) {
      logger.error(`[${plugin.manifest.id}] Operation failed: ${operation}`, error as Error)
      throw error
    }
  }

  /**
   * Check rate limit
   */
  private isRateLimited(pluginId: string): boolean {
    const limit = this.rateLimits.get(pluginId)
    if (!limit) return false

    if (Date.now() > limit.resetAt) {
      this.rateLimits.delete(pluginId)
      return false
    }

    return limit.count >= 1000 // 1000 operations per minute
  }

  /**
   * Update rate limit counter
   */
  private updateRateLimit(pluginId: string): void {
    const now = Date.now()
    const limit = this.rateLimits.get(pluginId)

    if (!limit || now > limit.resetAt) {
      this.rateLimits.set(pluginId, {
        count: 1,
        resetAt: now + 60000 // 1 minute
      })
    } else {
      limit.count++
    }
  }

  /**
   * Block an operation
   */
  blockOperation(operation: string): void {
    this.blockedOps.add(operation)
  }

  /**
   * Unblock an operation
   */
  unblockOperation(operation: string): void {
    this.blockedOps.delete(operation)
  }

  /**
   * Get sandbox stats
   */
  getStats(): {
    blockedOps: number
    rateLimitedPlugins: number
  } {
    return {
      blockedOps: this.blockedOps.size,
      rateLimitedPlugins: Array.from(this.rateLimits.values())
        .filter(l => l.count >= 1000).length
    }
  }
}
