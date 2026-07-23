import { EventEmitter } from 'events'
import { Logger } from '@services/logger'

const logger = new Logger('GraphHistory')

/**
 * History entry for undo/redo
 */
export interface HistoryEntry {
  id: string
  type: 'addNode' | 'removeNode' | 'moveNode' | 'updateNode' |
        'addConnection' | 'removeConnection' | 'addVariable' | 'removeVariable' |
        'batch'
  timestamp: number
  data: unknown
  undoData?: unknown
}

/**
 * GraphHistory - Undo/Redo system for the graph editor
 *
 * Responsibilities:
 * - Track all editor actions
 * - Support undo/redo operations
 * - Maintain history stack with limits
 */
export class GraphHistory extends EventEmitter {
  private static instance: GraphHistory
  private undoStack: HistoryEntry[] = []
  private redoStack: HistoryEntry[] = []
  private maxSize: number = 100

  private constructor() {
    super()
  }

  static getInstance(): GraphHistory {
    if (!GraphHistory.instance) {
      GraphHistory.instance = new GraphHistory()
    }
    return GraphHistory.instance
  }

  /**
   * Add an entry to the history
   */
  addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
    const fullEntry: HistoryEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: Date.now()
    }

    this.undoStack.push(fullEntry)

    // Clear redo stack on new action
    this.redoStack = []

    // Trim if exceeding max size
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift()
    }

    this.emit('entryAdded', fullEntry)
  }

  /**
   * Undo the last action
   */
  undo(): HistoryEntry | null {
    const entry = this.undoStack.pop()
    if (!entry) return null

    this.redoStack.push(entry)
    this.emit('undo', entry)
    logger.debug(`Undo: ${entry.type}`)

    return entry
  }

  /**
   * Redo the last undone action
   */
  redo(): HistoryEntry | null {
    const entry = this.redoStack.pop()
    if (!entry) return null

    this.undoStack.push(entry)
    this.emit('redo', entry)
    logger.debug(`Redo: ${entry.type}`)

    return entry
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * Get undo stack size
   */
  getUndoSize(): number {
    return this.undoStack.length
  }

  /**
   * Get redo stack size
   */
  getRedoSize(): number {
    return this.redoStack.length
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = []
    this.redoStack = []
    this.emit('cleared')
    logger.debug('History cleared')
  }

  /**
   * Get all undo entries (for display)
   */
  getUndoEntries(): HistoryEntry[] {
    return [...this.undoStack]
  }

  /**
   * Get all redo entries (for display)
   */
  getRedoEntries(): HistoryEntry[] {
    return [...this.redoStack]
  }

  private generateId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  }
}
