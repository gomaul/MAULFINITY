import { Action } from './ActionEngine'

export class ActionRegistry {
  private actions: Map<string, Action> = new Map()

  /**
   * Register an action
   */
  register(type: string, action: Action): void {
    this.actions.set(type, action)
  }

  /**
   * Get an action by type
   */
  get(type: string): Action | undefined {
    return this.actions.get(type)
  }

  /**
   * Get all registered action types
   */
  getTypes(): string[] {
    return Array.from(this.actions.keys())
  }

  /**
   * Check if an action type is registered
   */
  has(type: string): boolean {
    return this.actions.has(type)
  }

  /**
   * Unregister an action
   */
  unregister(type: string): void {
    this.actions.delete(type)
  }
}
