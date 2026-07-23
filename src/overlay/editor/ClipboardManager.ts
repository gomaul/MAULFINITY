import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import { EditorObject } from './types'

const logger = new Logger('ClipboardManager')

/**
 * ClipboardManager - Manages copy/paste operations
 */
export class ClipboardManager extends EventEmitter {
  private static instance: ClipboardManager
  private clipboard: EditorObject[] = []
  private clipboardType: 'copy' | 'cut' = 'copy'

  private constructor() {
    super()
  }

  static getInstance(): ClipboardManager {
    if (!ClipboardManager.instance) {
      ClipboardManager.instance = new ClipboardManager()
    }
    return ClipboardManager.instance
  }

  /**
   * Copy objects
   */
  copy(objects: EditorObject[]): void {
    this.clipboard = objects.map(obj => JSON.parse(JSON.stringify(obj)))
    this.clipboardType = 'copy'
    logger.debug(`Copied ${objects.length} objects`)
  }

  /**
   * Cut objects
   */
  cut(objects: EditorObject[]): void {
    this.clipboard = objects.map(obj => JSON.parse(JSON.stringify(obj)))
    this.clipboardType = 'cut'
    logger.debug(`Cut ${objects.length} objects`)
  }

  /**
   * Paste objects
   */
  paste(): EditorObject[] {
    if (this.clipboard.length === 0) return []

    const pasted = this.clipboard.map(obj => ({
      ...JSON.parse(JSON.stringify(obj)),
      id: this.generateId(),
      transform: {
        ...obj.transform,
        position: {
          x: obj.transform.position.x + 20,
          y: obj.transform.position.y + 20
        }
      }
    }))

    logger.debug(`Pasted ${pasted.length} objects`)
    this.emit('pasted', pasted)

    return pasted
  }

  /**
   * Get clipboard contents
   */
  getClipboard(): EditorObject[] {
    return [...this.clipboard]
  }

  /**
   * Check if clipboard has contents
   */
  hasContents(): boolean {
    return this.clipboard.length > 0
  }

  /**
   * Clear clipboard
   */
  clear(): void {
    this.clipboard = []
    logger.debug('Clipboard cleared')
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
