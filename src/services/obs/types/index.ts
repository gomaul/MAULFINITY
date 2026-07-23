/**
 * OBS WebSocket v5 Message Types
 */

// Message operation codes
export enum OBSMessageOp {
  Hello = 0,
  Identify = 1,
  Identified = 2,
  ReIdentify = 3,
  Event = 5,
  Request = 6,
  RequestResponse = 7,
  RequestBatch = 8,
  RequestBatchResponse = 9
}

// Request types
export enum OBSRequestType {
  // Scene
  GetSceneList = 'GetSceneList',
  SetCurrentProgramScene = 'SetCurrentProgramScene',
  GetCurrentProgramScene = 'GetCurrentProgramScene',
  GetSceneItemList = 'GetSceneItemList',
  SetSceneItemEnabled = 'SetSceneItemEnabled',
  GetSceneItemProperties = 'GetSceneItemProperties',
  SetSceneItemProperties = 'SetSceneItemProperties',

  // Source
  GetSourceTypeInfo = 'GetSourceTypeInfo',
  GetInputList = 'GetInputList',
  GetInputProperties = 'GetInputProperties',
  SetInputSettings = 'SetInputSettings',

  // Recording
  StartRecording = 'StartRecording',
  StopRecording = 'StopRecording',
  ToggleRecording = 'ToggleRecording',
  GetRecordStatus = 'GetRecordStatus',
  SetRecordingFolder = 'SetRecordingFolder',

  // Streaming
  StartStream = 'StartStream',
  StopStream = 'StopStream',
  ToggleStream = 'ToggleStream',
  GetStreamStatus = 'GetStreamStatus',
  SetStreamSettings = 'SetStreamSettings',

  // Stats
  GetStats = 'GetStats',
  GetHeartbeat = 'GetHeartbeat'
}

// Event types
export enum OBSEventType {
  SwitchScenes = 'SwitchScenes',
  SceneListChanged = 'SceneListChanged',
  RecordingStateChanged = 'RecordingStateChanged',
  StreamStateChanged = 'StreamStateChanged',
  SourceCreated = 'SourceCreated',
  SourceDestroyed = 'SourceDestroyed',
  SourceTextChanged = 'SourceTextChanged',
  InputCreated = 'InputCreated',
  InputRemoved = 'InputRemoved',
  InputSettingsChanged = 'InputSettingsChanged'
}

// Scene
export interface OBSScene {
  name: string
  isActive: boolean
  index?: number
}

// Source
export interface OBSSource {
  name: string
  type: string
  enabled: boolean
  visible: boolean
  settings?: Record<string, unknown>
}

// Recording status
export interface OBSRecordingStatus {
  active: boolean
  paused: boolean
  timecode: string
  duration: number
  bytesWritten: number
}

// Streaming status
export interface OBSStreamingStatus {
  active: boolean
  timecode: string
  duration: number
  bytesSent: number
  bitrate: number
}

// OBS Stats
export interface OBSStats {
  cpu: number
  memory: number
  fps: number
  bitrate: number
  droppedFrames?: number
  totalFrames?: number
}

// OBS Connection Config
export interface OBSConnectionConfig {
  host: string
  port: number
  password?: string
  autoReconnect?: boolean
  reconnectDelay?: number
  maxReconnectAttempts?: number
}

// OBS Connection Status
export type OBSConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

// OBS State
export interface OBSState {
  status: OBSConnectionStatus
  scenes: OBSScene[]
  currentScene: string | null
  sources: OBSSource[]
  isRecording: boolean
  isStreaming: boolean
  recordingTime: number
  streamingTime: number
  stats: OBSStats
}

// WebSocket Message
export interface OBSMessage {
  op: OBSMessageOp
  d?: Record<string, unknown>
}

// Hello Message
export interface OBSHelloMessage {
  op: OBSMessageOp.Hello
  d: {
    obsWebSocketVersion: string
    rpcVersion: number
    authentication?: {
      salt: string
      challenge: string
    }
  }
}

// Identify Message
export interface OBSIdentifyMessage {
  op: OBSMessageOp.Identify
  d: {
    rpcVersion: number
    authentication?: string
    eventSubscriptions?: number
  }
}

// Identified Message
export interface OBSIdentifiedMessage {
  op: OBSMessageOp.Identified
  d: {
    negotiatedRpcVersion: number
  }
}

// Event Message
export interface OBSEventMessage {
  op: OBSMessageOp.Event
  d: {
    eventType: string
    eventData?: unknown
  }
}

// Request Message
export interface OBSRequestMessage {
  op: OBSMessageOp.Request
  d: {
    requestId: string
    requestType: string
    requestData?: unknown
  }
}

// Request Response Message
export interface OBSRequestResponseMessage {
  op: OBSMessageOp.RequestResponse
  d: {
    requestId: string
    requestType: string
    requestData?: unknown
    resultData?: unknown
    error?: {
      code: number
      comment: string
    }
  }
}

// Request Batch Message
export interface OBSRequestBatchMessage {
  op: OBSMessageOp.RequestBatch
  d: {
    requestId: string
    requests: Array<{
      requestType: string
      requestData?: unknown
    }>
    executionType?: number
  }
}

// Request Batch Response Message
export interface OBSRequestBatchResponseMessage {
  op: OBSMessageOp.RequestBatchResponse
  d: {
    requestId: string
    results: Array<{
      requestType: string
      resultData?: unknown
      error?: {
        code: number
        comment: string
      }
    }>
  }
}

// Scene Item
export interface OBSSceneItem {
  sceneItemId: number
  sourceName: string
  sceneItemIndex: number
  sceneItemEnabled: boolean
  sceneItemLocked?: boolean
  sceneItemTransform?: {
    positionX: number
    positionY: number
    scaleX: number
    scaleY: number
    rotation: number
    width: number
    height: number
  }
}

// Input Info
export interface OBSInputInfo {
  inputName: string
  inputKind: string
  inputUuid: string
  inputSettings?: Record<string, unknown>
  defaultInputSettings?: Record<string, unknown>
}
