/**
 * Overlay Editor Types
 * 
 * Types for the Visual Overlay Editor system
 */

// ============================================================
// CANVAS TYPES
// ============================================================

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Transform {
  position: Point
  size: { width: number; height: number }
  rotation: number
  scale: Point
  anchor: Point
}

// ============================================================
// EDITOR OBJECT TYPES
// ============================================================

export type EditorObjectType = 
  | 'image' 
  | 'gif' 
  | 'video' 
  | 'audio' 
  | 'text' 
  | 'counter' 
  | 'progress' 
  | 'queue' 
  | 'avatar' 
  | 'rectangle' 
  | 'circle' 
  | 'container'

export interface EditorObject {
  id: string
  type: EditorObjectType
  name: string
  transform: Transform
  opacity: number
  visible: boolean
  locked: boolean
  zIndex: number
  config: Record<string, unknown>
  animation?: EditorAnimation
  metadata?: Record<string, unknown>
}

// ============================================================
// ANIMATION TYPES
// ============================================================

export type AnimationEasing = 
  | 'linear' 
  | 'ease' 
  | 'ease-in' 
  | 'ease-out' 
  | 'ease-in-out' 
  | 'bounce' 
  | 'elastic'

export type AnimationType = 
  | 'fade' 
  | 'move' 
  | 'scale' 
  | 'rotate' 
  | 'shake' 
  | 'bounce'

export interface EditorAnimation {
  type: AnimationType
  duration: number
  delay: number
  loop: boolean
  easing: AnimationEasing
  keyframes: AnimationKeyframe[]
}

export interface AnimationKeyframe {
  time: number
  value: Record<string, unknown>
}

// ============================================================
// SCENE TYPES
// ============================================================

export interface EditorScene {
  id: string
  name: string
  width: number
  height: number
  backgroundColor: string
  backgroundOpacity: number
  objects: EditorObject[]
  settings: SceneSettings
}

export interface SceneSettings {
  showGrid: boolean
  gridSize: number
  snapToGrid: boolean
  showSafeArea: boolean
  safeAreaMargin: number
}

// ============================================================
// EDITOR STATE TYPES
// ============================================================

export type EditorMode = 'select' | 'pan' | 'zoom' | 'draw'

export interface EditorViewport {
  x: number
  y: number
  zoom: number
}

export interface EditorSelection {
  objectIds: string[]
  mode: 'single' | 'multi' | 'box'
}

export interface EditorState {
  mode: EditorMode
  viewport: EditorViewport
  selection: EditorSelection
  scene: EditorScene | null
  history: HistoryEntry[]
  historyIndex: number
}

// ============================================================
// HISTORY TYPES
// ============================================================

export interface HistoryEntry {
  id: string
  type: 'add' | 'remove' | 'update' | 'reorder'
  timestamp: number
  data: unknown
  undoData?: unknown
}

// ============================================================
// LAYER TYPES
// ============================================================

export interface LayerInfo {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  objectCount: number
}

// ============================================================
// INSPECTOR TYPES
// ============================================================

export interface InspectorProperty {
  key: string
  label: string
  type: 'number' | 'string' | 'boolean' | 'select' | 'color' | 'slider'
  value: unknown
  options?: { label: string; value: unknown }[]
  min?: number
  max?: number
  step?: number
}

// ============================================================
// SAVE FORMAT TYPES
// ============================================================

export interface MaulOverlayFile {
  version: string
  name: string
  width: number
  height: number
  backgroundColor: string
  objects: EditorObject[]
  animations: EditorAnimation[]
  assets: string[]
  metadata: OverlayMetadata
}

export interface OverlayMetadata {
  createdAt: string
  updatedAt: string
  author: string
  description?: string
}
