import { IpcMainInvokeEvent, dialog, BrowserWindow } from 'electron'
import { Logger } from '@services/logger'
import { OverlayRepository } from '@services/database/repositories/OverlayRepository'
import { v4 as uuidv4 } from 'uuid'
import { readFileSync, writeFileSync } from 'fs'

const logger = new Logger('OverlayEditorIPC')
const overlayRepo = new OverlayRepository()

// In-memory editor state
let editorState: {
  sceneId: string | null
  scene: unknown
  history: unknown[]
  historyIndex: number
} = {
  sceneId: null,
  scene: null,
  history: [],
  historyIndex: -1
}

export const overlayEditorHandlers = {
  /**
   * Create new overlay scene
   */
  async newScene(_event: IpcMainInvokeEvent, data: { name: string; width: number; height: number }): Promise<{ id: string }> {
    const id = uuidv4()
    const now = new Date().toISOString()
    
    const scene = {
      id,
      name: data.name,
      width: data.width,
      height: data.height,
      backgroundColor: '#000000',
      backgroundOpacity: 1,
      objects: [],
      settings: {
        showGrid: true,
        gridSize: 20,
        snapToGrid: true,
        showSafeArea: true,
        safeAreaMargin: 50
      }
    }

    // Save to database
    overlayRepo.create({
      id,
      profile_id: 'default',
      name: data.name,
      scene_json: JSON.stringify(scene),
      created_at: now,
      updated_at: now
    })

    editorState.sceneId = id
    editorState.scene = scene
    editorState.history = [scene]
    editorState.historyIndex = 0

    logger.info(`New overlay scene created: ${data.name}`)
    return { id }
  },

  /**
   * Save overlay scene
   */
  async save(_event: IpcMainInvokeEvent, data: { id: string; scene: unknown }): Promise<void> {
    const now = new Date().toISOString()
    
    overlayRepo.update(data.id, {
      scene_json: JSON.stringify(data.scene),
      updated_at: now
    })

    logger.info(`Overlay scene saved: ${data.id}`)
  },

  /**
   * Load overlay scene
   */
  async load(_event: IpcMainInvokeEvent, id: string): Promise<{ scene: unknown; id: string } | null> {
    const overlay = overlayRepo.findById(id)
    if (!overlay) return null

    const scene = JSON.parse(overlay.scene_json)
    editorState.sceneId = id
    editorState.scene = scene
    editorState.history = [scene]
    editorState.historyIndex = 0

    logger.info(`Overlay scene loaded: ${id}`)
    return { scene, id }
  },

  /**
   * Export overlay to .mauloverlay file
   */
  async exportScene(_event: IpcMainInvokeEvent, data: { scene: unknown; defaultName?: string }): Promise<string | null> {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return null

    const result = await dialog.showSaveDialog(window, {
      title: 'Export Overlay',
      defaultPath: `${data.defaultName || 'overlay'}.mauloverlay`,
      filters: [
        { name: 'Maulfinity Overlay', extensions: ['mauloverlay'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (result.canceled || !result.filePath) return null

    const exportData = {
      version: '1.0.0',
      ...data.scene,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'Maulfinity'
      }
    }

    writeFileSync(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8')
    logger.info(`Overlay exported to: ${result.filePath}`)
    return result.filePath
  },

  /**
   * Import overlay from .mauloverlay file
   */
  async importScene(_event: IpcMainInvokeEvent): Promise<{ scene: unknown; name: string } | null> {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return null

    const result = await dialog.showOpenDialog(window, {
      title: 'Import Overlay',
      filters: [
        { name: 'Maulfinity Overlay', extensions: ['mauloverlay'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    const content = readFileSync(filePath, 'utf-8')
    const scene = JSON.parse(content)

    logger.info(`Overlay imported from: ${filePath}`)
    return { scene, name: scene.name || 'Imported Overlay' }
  },

  /**
   * Undo last action
   */
  async undo(_event: IpcMainInvokeEvent): Promise<{ scene: unknown; canUndo: boolean; canRedo: boolean } | null> {
    if (editorState.historyIndex <= 0) return null

    editorState.historyIndex--
    editorState.scene = editorState.history[editorState.historyIndex]

    return {
      scene: editorState.scene,
      canUndo: editorState.historyIndex > 0,
      canRedo: editorState.historyIndex < editorState.history.length - 1
    }
  },

  /**
   * Redo last undone action
   */
  async redo(_event: IpcMainInvokeEvent): Promise<{ scene: unknown; canUndo: boolean; canRedo: boolean } | null> {
    if (editorState.historyIndex >= editorState.history.length - 1) return null

    editorState.historyIndex++
    editorState.scene = editorState.history[editorState.historyIndex]

    return {
      scene: editorState.scene,
      canUndo: editorState.historyIndex > 0,
      canRedo: editorState.historyIndex < editorState.history.length - 1
    }
  },

  /**
   * Add to history
   */
  async addToHistory(_event: IpcMainInvokeEvent, scene: unknown): Promise<{ canUndo: boolean; canRedo: boolean }> {
    // Remove any redo history
    editorState.history = editorState.history.slice(0, editorState.historyIndex + 1)
    
    // Add new state
    editorState.history.push(scene)
    editorState.historyIndex++
    editorState.scene = scene

    // Limit history to 50 entries
    if (editorState.history.length > 50) {
      editorState.history.shift()
      editorState.historyIndex--
    }

    return {
      canUndo: editorState.historyIndex > 0,
      canRedo: false
    }
  },

  /**
   * Get editor state
   */
  async getState(_event: IpcMainInvokeEvent): Promise<{
    sceneId: string | null
    scene: unknown
    canUndo: boolean
    canRedo: boolean
  }> {
    return {
      sceneId: editorState.sceneId,
      scene: editorState.scene,
      canUndo: editorState.historyIndex > 0,
      canRedo: editorState.historyIndex < editorState.history.length - 1
    }
  }
}
