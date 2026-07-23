import { Logger } from '@services/logger'
import { PluginPermission, Plugin } from './types'

const logger = new Logger('PluginPermissionManager')

/**
 * PluginPermissionManager - Enforces plugin permissions
 * 
 * Plugins can only access APIs they have permission for.
 * Permissions are granted by the user during installation.
 */
export class PluginPermissionManager {
  /** All available permissions */
  private static readonly ALL_PERMISSIONS: PluginPermission[] = [
    'events.read', 'events.write', 'events.subscribe',
    'actions.create', 'actions.execute',
    'graph.register-node', 'graph.execute-node',
    'connector.register', 'connector.connect',
    'overlay.create', 'overlay.modify', 'overlay.render',
    'game.register-adapter', 'game.connect',
    'database.read', 'database.write',
    'network.http', 'network.websocket',
    'filesystem.read-plugin', 'filesystem.write-plugin',
    'ui.add-menu', 'ui.add-settings', 'ui.add-page', 'ui.notify'
  ]

  /**
   * Get all available permissions
   */
  static getAllPermissions(): PluginPermission[] {
    return [...PluginPermissionManager.ALL_PERMISSIONS]
  }

  /**
   * Get permission categories
   */
  static getPermissionCategories(): Record<string, PluginPermission[]> {
    return {
      'Events': ['events.read', 'events.write', 'events.subscribe'],
      'Actions': ['actions.create', 'actions.execute'],
      'Graph': ['graph.register-node', 'graph.execute-node'],
      'Connectors': ['connector.register', 'connector.connect'],
      'Overlay': ['overlay.create', 'overlay.modify', 'overlay.render'],
      'Games': ['game.register-adapter', 'game.connect'],
      'Database': ['database.read', 'database.write'],
      'Network': ['network.http', 'network.websocket'],
      'File System': ['filesystem.read-plugin', 'filesystem.write-plugin'],
      'UI': ['ui.add-menu', 'ui.add-settings', 'ui.add-page', 'ui.notify']
    }
  }

  /**
   * Check if a plugin has a specific permission
   */
  hasPermission(plugin: Plugin, permission: PluginPermission): boolean {
    return plugin.grantedPermissions.includes(permission)
  }

  /**
   * Check if a plugin has all required permissions
   */
  hasAllPermissions(plugin: Plugin, permissions: PluginPermission[]): boolean {
    return permissions.every(p => this.hasPermission(plugin, p))
  }

  /**
   * Grant permission to a plugin
   */
  grantPermission(plugin: Plugin, permission: PluginPermission): void {
    if (!plugin.grantedPermissions.includes(permission)) {
      plugin.grantedPermissions.push(permission)
      logger.info(`[${plugin.manifest.id}] Permission granted: ${permission}`)
    }
  }

  /**
   * Revoke permission from a plugin
   */
  revokePermission(plugin: Plugin, permission: PluginPermission): void {
    const index = plugin.grantedPermissions.indexOf(permission)
    if (index > -1) {
      plugin.grantedPermissions.splice(index, 1)
      logger.info(`[${plugin.manifest.id}] Permission revoked: ${permission}`)
    }
  }

  /**
   * Get required permissions from manifest
   */
  getRequiredPermissions(manifest: import('./types').PluginManifest): PluginPermission[] {
    return (manifest.permissions || []) as PluginPermission[]
  }

  /**
   * Validate permissions against available
   */
  validatePermissions(permissions: PluginPermission[]): {
    valid: boolean
    invalid: PluginPermission[]
  } {
    const invalid = permissions.filter(
      p => !PluginPermissionManager.ALL_PERMISSIONS.includes(p)
    )
    return {
      valid: invalid.length === 0,
      invalid
    }
  }

  /**
   * Get permission description
   */
  static getPermissionDescription(permission: PluginPermission): string {
    const descriptions: Record<string, string> = {
      'events.read': 'Read events from the event bus',
      'events.write': 'Emit events to the event bus',
      'events.subscribe': 'Subscribe to events',
      'actions.create': 'Register custom actions',
      'actions.execute': 'Execute actions',
      'graph.register-node': 'Register custom automation nodes',
      'graph.execute-node': 'Execute automation nodes',
      'connector.register': 'Register custom connectors',
      'connector.connect': 'Connect to external platforms',
      'overlay.create': 'Create overlay elements',
      'overlay.modify': 'Modify overlay elements',
      'overlay.render': 'Render overlays',
      'game.register-adapter': 'Register game adapters',
      'game.connect': 'Connect to games',
      'database.read': 'Read from database',
      'database.write': 'Write to database',
      'network.http': 'Make HTTP requests',
      'network.websocket': 'Use WebSocket connections',
      'filesystem.read-plugin': 'Read plugin directory',
      'filesystem.write-plugin': 'Write to plugin directory',
      'ui.add-menu': 'Add menu items',
      'ui.add-settings': 'Add settings pages',
      'ui.add-page': 'Add application pages',
      'ui.notify': 'Show notifications'
    }
    return descriptions[permission] || permission
  }
}
