import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import { HistoryEntry } from './types'

const logger = new Logger('HistoryManager')

/**
 * HistoryManager - Manages undo/redo history
 */
export class HistoryManager extends EventEmitter {
  private static instance: HistoryManager
  private history: HistoryEntry[] = []
  private historyIndex: number = -1
  private maxHistory: number = 100

  private constructor() {
    super()
  }

  static getInstance(): HistoryManager {
    if (!HistoryManager.instance) {
      HistoryManager.instance = new HistoryManager()
    }
    return HistoryManager.instance
  }

  /**
   * Add entry to history
   */
  addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
    // Remove any entries after current index (discard redo stack)
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
    }

    // Add new entry
    const newEntry: HistoryEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: Date.now()
    }

    this.history.push(newEntry)

    // Trim history if exceeding max
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    } else {
      this.historyIndex++
    }

    logger.debug(`History entry added: ${entry.type}`)
    this.emit('historyChanged', this.canUndo(), this.canRedo())
  }

  /**
   * Undo last action
   */
  undo(): HistoryEntry | null {
    if (!this.canUndo()) return null

    const entry = this.history[this.historyIndex]
    this.historyIndex--

    logger.debug(`Undo: ${entry.type}`)
    this.emit('undo', entry)
    this.emit('historyChanged', this.canUndo(), this.canRedo())

    return entry
  }

  /**
   * Redo last undone action
   */
  redo(): HistoryEntry | null {
    if (!this.canRedo()) return null

    this.historyIndex++
    const entry = this.history[this.historyIndex]

    logger.debug(`Redo: ${entry.type}`)
    this.emit('redo', entry)
    this.emit('historyChanged', this.canUndo(), this.canRedo())

    return entry
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.historyIndex >= 0
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = []
    this.historyIndex = -1
    logger.info('History cleared')
    this.emit('historyChanged', false, false)
  }

  /**
   * Get history
   */
  getHistory(): HistoryEntry[] {
    return [...this.history]
  }

  /**
   * Get current index
   */
  getCurrentIndex(): number {
    return this.historyIndex
  }

  /**
   * Set max history size
   */
  setMaxHistory(max: number): void {
    this.maxHistory = max
    if (this.history.length > max) {
      this.history = this.history.slice(-max)
      this.historyIndex = Math.min(this.historyIndex, max - 1)
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
