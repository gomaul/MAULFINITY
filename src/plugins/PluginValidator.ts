import { PluginManifest, PluginPermission } from './types'

/**
 * ValidationResult
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * PluginValidator - Validates plugin manifests and configurations
 */
export class PluginValidator {
  /**
   * Validate a plugin manifest
   */
  static validateManifest(manifest: PluginManifest): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!manifest.id || typeof manifest.id !== 'string') {
      errors.push('id is required and must be a string')
    } else if (!/^[a-z0-9-_.]+$/i.test(manifest.id)) {
      errors.push('id must contain only alphanumeric characters, hyphens, dots, and underscores')
    }

    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push('name is required and must be a string')
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push('version is required and must be a string')
    } else if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      errors.push('version must follow semantic versioning (MAJOR.MINOR.PATCH)')
    }

    if (!manifest.description || typeof manifest.description !== 'string') {
      errors.push('description is required and must be a string')
    }

    if (!manifest.author || typeof manifest.author !== 'string') {
      errors.push('author is required and must be a string')
    }

    if (!manifest.entry || typeof manifest.entry !== 'string') {
      errors.push('entry is required and must be a string')
    }

    if (!manifest.type) {
      errors.push('type is required')
    }

    // Engines validation
    if (!manifest.engines) {
      errors.push('engines is required')
    } else {
      if (!manifest.engines.maulfinity) {
        errors.push('engines.maulfinity is required')
      }
      if (!manifest.engines.sdk) {
        errors.push('engines.sdk is required')
      }
    }

    // Permissions validation
    if (manifest.permissions && !Array.isArray(manifest.permissions)) {
      errors.push('permissions must be an array')
    }

    // Dependencies validation
    if (manifest.dependencies && typeof manifest.dependencies !== 'object') {
      errors.push('dependencies must be an object')
    }

    // Warnings
    if (!manifest.license) {
      warnings.push('license is recommended')
    }

    if (!manifest.homepage) {
      warnings.push('homepage is recommended')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate permissions
   */
  static validatePermissions(
    requested: PluginPermission[],
    granted: PluginPermission[]
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    for (const permission of requested) {
      if (!granted.includes(permission)) {
        errors.push(`Permission not granted: ${permission}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate dependencies
   */
  static validateDependencies(
    dependencies: Record<string, string>,
    installed: Array<{ id: string; version: string }>
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    for (const [depId, versionReq] of Object.entries(dependencies)) {
      const installedDep = installed.find(p => p.id === depId)
      if (!installedDep) {
        errors.push(`Missing dependency: ${depId}`)
      }
      // TODO: Version comparison
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate plugin ID format
   */
  static isValidPluginId(id: string): boolean {
    return /^[a-z0-9-_.]+$/i.test(id)
  }

  /**
   * Validate version format
   */
  static isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version)
  }
}
