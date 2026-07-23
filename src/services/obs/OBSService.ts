import { EventEmitter } from 'events'
import { Logger } from '@services/logger'

const logger = new Logger('OBSService')

export interface OBSConnectionConfig {
  host: string
  port: number
  password?: string
  autoReconnect?: boolean
  reconnectDelay?: number
  maxReconnectAttempts?: number
}

export type OBSConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface OBSScene {
  name: string
  isActive: boolean
}

export interface OBSSource {
  name: string
  type: string
  enabled: boolean
  visible: boolean
}

export interface OBSState {
  status: OBSConnectionStatus
  scenes: OBSScene[]
  currentScene: string | null
  sources: OBSSource[]
  isRecording: boolean
  isStreaming: boolean
  recordingTime: number
  streamingTime: number
  stats: {
    cpu: number
    memory: number
    fps: number
    bitrate: number
  }
}

/**
 * OBSService - Main OBS Integration Service
 * 
 * Responsibilities:
 * - Connect to OBS WebSocket v5
 * - Auto reconnect
 * - Heartbeat
 * - Scene switching
 * - Source visibility
 * - Recording control
 * - Streaming control
 * - Receive OBS events
 * - Emit normalized events to Event Bus
 */
export class OBSService extends EventEmitter {
  private static instance: OBSService
  private config: OBSConnectionConfig
  private status: OBSConnectionStatus = 'disconnected'
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private messageId = 0
  private pendingRequests: Map<number, { resolve: (value: unknown) => void; reject: (reason: unknown) => void }> = new Map()
  private state: OBSState

  private constructor() {
    super()
    this.config = {
      host: 'localhost',
      port: 4455,
      password: '',
      autoReconnect: true,
      reconnectDelay: 5000,
      maxReconnectAttempts: 5
    }
    this.state = {
      status: 'disconnected',
      scenes: [],
      currentScene: null,
      sources: [],
      isRecording: false,
      isStreaming: false,
      recordingTime: 0,
      streamingTime: 0,
      stats: { cpu: 0, memory: 0, fps: 0, bitrate: 0 }
    }
  }

  static getInstance(): OBSService {
    if (!OBSService.instance) {
      OBSService.instance = new OBSService()
    }
    return OBSService.instance
  }

  /**
   * Update OBS connection configuration
   */
  configure(config: Partial<OBSConnectionConfig>): void {
    this.config = { ...this.config, ...config }
    logger.info('OBS configuration updated')
  }

  /**
   * Get current OBS state
   */
  getState(): OBSState {
    return { ...this.state }
  }

  /**
   * Get connection status
   */
  getStatus(): OBSConnectionStatus {
    return this.status
  }

  /**
   * Connect to OBS WebSocket
   */
  async connect(): Promise<boolean> {
    if (this.status === 'connected' || this.status === 'connecting') {
      logger.warning('Already connected or connecting to OBS')
      return false
    }

    this.setStatus('connecting')
    logger.info(`Connecting to OBS at ${this.config.host}:${this.config.port}`)

    try {
      // OBS WebSocket v5 protocol
      const url = `ws://${this.config.host}:${this.config.port}`
      
      // Create WebSocket connection
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        logger.info('WebSocket connected, authenticating...')
        this.authenticate()
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data as string)
      }

      this.ws.onerror = (error) => {
        logger.error('WebSocket error', error as Error)
        this.handleError('WebSocket error')
      }

      this.ws.onclose = () => {
        logger.info('WebSocket closed')
        this.handleDisconnect()
      }

      return true
    } catch (error) {
      logger.error('Failed to connect to OBS', error as Error)
      this.setStatus('error')
      return false
    }
  }

  /**
   * Disconnect from OBS
   */
  async disconnect(): Promise<void> {
    logger.info('Disconnecting from OBS')
    this.stopHeartbeat()
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.reconnectAttempts = 0
    this.setStatus('disconnected')
    this.updateState({ scenes: [], currentScene: null, sources: [] })
  }

  /**
   * Authenticate with OBS WebSocket
   */
  private async authenticate(): Promise<void> {
    try {
      // OBS WebSocket v5 uses Hello/Identify handshake
      // First, we need to wait for the Hello message
      // Then send Identify with password
      logger.info('Waiting for OBS Hello message...')
      // The actual authentication happens in handleMessage
    } catch (error) {
      logger.error('Authentication failed', error as Error)
      this.handleError('Authentication failed')
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data)
      
      // OBS WebSocket v5 message types
      switch (message.op) {
        case 0: // Hello
          this.handleHello(message.d)
          break
        case 2: // Identified
          this.handleIdentified()
          break
        case 5: // Event
          this.handleOBSEvent(message.d)
          break
        case 7: // RequestResponse
          this.handleRequestResponse(message.d)
          break
        case 9: // RequestBatchResponse
          this.handleBatchResponse(message.d)
          break
        default:
          logger.debug(`Unknown message op: ${message.op}`)
      }
    } catch (error) {
      logger.error('Failed to parse OBS message', error as Error)
    }
  }

  /**
   * Handle Hello message from OBS
   */
  private async handleHello(hello: { obsWebSocketVersion?: string; rpcVersion?: number; authentication?: { salt: string; challenge: string } }): Promise<void> {
    logger.info(`OBS Hello received, version: ${hello.obsWebSocketVersion}, rpc: ${hello.rpcVersion}`)
    
    // Send Identify message with authentication
    const identify: Record<string, unknown> = {
      op: 1, // Identify
      d: {
        rpcVersion: 5,
        eventSubscriptions: 33 // All events
      }
    }

    // If authentication is required
    if (hello.authentication && this.config.password) {
      const { salt, challenge } = hello.authentication
      const passwordHash = await this.hashPassword(this.config.password, salt)
      const authenticationString = await this.hashPassword(passwordHash, challenge)
      identify.d = {
        ...identify.d,
        authentication: authenticationString
      }
    }

    this.send(identify)
  }

  /**
   * Hash password for OBS authentication
   */
  private async hashPassword(password: string, salt: string): Promise<string> {
    // Use Web Crypto API for SHA-256
    const encoder = new TextEncoder()
    const data = encoder.encode(password + salt)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Handle Identified message
   */
  private handleIdentified(): void {
    logger.info('OBS authenticated successfully')
    this.setStatus('connected')
    this.reconnectAttempts = 0
    this.startHeartbeat()
    this.fetchInitialState()
    this.emit('connected')
  }

  /**
   * Fetch initial OBS state
   */
  private async fetchInitialState(): Promise<void> {
    try {
      // Get scene list
      const sceneList = await this.request('GetSceneList')
      if (sceneList) {
        const scenes = (sceneList as { scenes: Array<{ sceneName: string }> }).scenes.map(s => ({
          name: s.sceneName,
          isActive: false
        }))
        const currentScene = (sceneList as { currentProgramSceneName: string }).currentProgramSceneName
        this.updateState({ scenes, currentScene })
      }

      // Get recording status
      const recordingStatus = await this.request('GetRecordStatus')
      if (recordingStatus) {
        this.updateState({
          isRecording: (recordingStatus as { outputActive: boolean }).outputActive,
          recordingTime: (recordingStatus as { outputTimeCode: string }) ? this.parseTimeCode((recordingStatus as { outputTimeCode: string }).outputTimeCode) : 0
        })
      }

      // Get streaming status
      const streamingStatus = await this.request('GetStreamStatus')
      if (streamingStatus) {
        this.updateState({
          isStreaming: (streamingStatus as { outputActive: boolean }).outputActive,
          streamingTime: (streamingStatus as { outputTimeCode: string }) ? this.parseTimeCode((streamingStatus as { outputTimeCode: string }).outputTimeCode) : 0
        })
      }

      logger.info('Initial OBS state fetched')
    } catch (error) {
      logger.error('Failed to fetch initial OBS state', error as Error)
    }
  }

  /**
   * Parse time code string to seconds
   */
  private parseTimeCode(timeCode: string): number {
    const parts = timeCode.split(':').map(Number)
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return 0
  }

  /**
   * Handle OBS events
   */
  private handleOBSEvent(event: { eventType: string; eventData?: unknown }): void {
    const { eventType, eventData } = event
    
    switch (eventType) {
      case 'SwitchScenes':
        this.handleSceneSwitch(eventData as { sceneName: string })
        break
      case 'SceneListChanged':
        this.handleSceneListChanged(eventData as { scenes: Array<{ sceneName: string }> })
        break
      case 'RecordingStateChanged':
        this.handleRecordingState(eventData as { outputActive: boolean; outputTimeCode?: string })
        break
      case 'StreamStateChanged':
        this.handleStreamingState(eventData as { outputActive: boolean; outputTimeCode?: string })
        break
      case 'SourceCreated':
      case 'SourceDestroyed':
      case 'SourceTextChanged':
        this.emit('sourceChanged', eventType, eventData)
        break
      default:
        logger.debug(`OBS event: ${eventType}`)
    }
  }

  /**
   * Handle scene switch
   */
  private handleSceneSwitch(data: { sceneName: string }): void {
    logger.info(`Scene switched to: ${data.sceneName}`)
    this.updateState({ currentScene: data.sceneName })
    this.emit('sceneSwitched', data.sceneName)
  }

  /**
   * Handle scene list change
   */
  private handleSceneListChanged(data: { scenes: Array<{ sceneName: string }> }): void {
    const scenes = data.scenes.map(s => ({
      name: s.sceneName,
      isActive: s.sceneName === this.state.currentScene
    }))
    this.updateState({ scenes })
  }

  /**
   * Handle recording state change
   */
  private handleRecordingState(data: { outputActive: boolean; outputTimeCode?: string }): void {
    logger.info(`Recording ${data.outputActive ? 'started' : 'stopped'}`)
    this.updateState({
      isRecording: data.outputActive,
      recordingTime: data.outputTimeCode ? this.parseTimeCode(data.outputTimeCode) : 0
    })
    this.emit('recordingStateChanged', data.outputActive)
  }

  /**
   * Handle streaming state change
   */
  private handleStreamingState(data: { outputActive: boolean; outputTimeCode?: string }): void {
    logger.info(`Streaming ${data.outputActive ? 'started' : 'stopped'}`)
    this.updateState({
      isStreaming: data.outputActive,
      streamingTime: data.outputTimeCode ? this.parseTimeCode(data.outputTimeCode) : 0
    })
    this.emit('streamingStateChanged', data.outputActive)
  }

  /**
   * Handle request response
   */
  private handleRequestResponse(response: { requestId: string; requestType: string; requestData?: unknown; resultData?: unknown; error?: { code: number; comment: string } }): void {
    const { requestId, resultData, error } = response
    const pending = this.pendingRequests.get(parseInt(requestId))
    
    if (pending) {
      this.pendingRequests.delete(parseInt(requestId))
      if (error) {
        pending.reject(new Error(error.comment))
      } else {
        pending.resolve(resultData)
      }
    }
  }

  /**
   * Handle batch response
   */
  private handleBatchResponse(response: { results: Array<{ requestType: string; resultData?: unknown; error?: { code: number; comment: string } }> }): void {
    // Handle batch responses if needed
  }

  /**
   * Send request to OBS
   */
  async request(requestType: string, requestData?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const requestId = ++this.messageId
      this.pendingRequests.set(requestId, { resolve, reject })

      this.send({
        op: 6, // Request
        d: {
          requestId: String(requestId),
          requestType,
          requestData
        }
      })

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId)
          reject(new Error('Request timeout'))
        }
      }, 10000)
    })
  }

  /**
   * Send WebSocket message
   */
  private send(message: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  /**
   * Handle connection error
   */
  private handleError(message: string): void {
    logger.error(message)
    this.setStatus('error')
    this.emit('error', message)
    
    if (this.config.autoReconnect) {
      this.scheduleReconnect()
    }
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(): void {
    if (this.status === 'connected') {
      this.setStatus('disconnected')
      this.stopHeartbeat()
      
      if (this.config.autoReconnect) {
        this.scheduleReconnect()
      }
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      logger.warning('Max reconnect attempts reached')
      this.setStatus('error')
      return
    }

    this.setStatus('reconnecting')
    this.reconnectAttempts++
    
    logger.info(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`)
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, this.config.reconnectDelay || 5000)
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      this.request('GetHeartbeat').catch(() => {
        // Heartbeat failed, connection might be lost
      })
    }, 30000)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Update connection status
   */
  private setStatus(status: OBSConnectionStatus): void {
    this.state.status = status
    this.emit('statusChanged', status)
  }

  /**
   * Update OBS state
   */
  private updateState(partial: Partial<OBSState>): void {
    this.state = { ...this.state, ...partial }
    this.emit('stateChanged', this.state)
  }

  // ============================================================
  // PUBLIC API - Scene Management
  // ============================================================

  /**
   * Get all scenes
   */
  async getScenes(): Promise<OBSScene[]> {
    try {
      const result = await this.request('GetSceneList')
      const scenes = (result as { scenes: Array<{ sceneName: string }> }).scenes.map(s => ({
        name: s.sceneName,
        isActive: s.sceneName === this.state.currentScene
      }))
      this.updateState({ scenes })
      return scenes
    } catch (error) {
      logger.error('Failed to get scenes', error as Error)
      return []
    }
  }

  /**
   * Switch to a scene
   */
  async switchScene(sceneName: string): Promise<boolean> {
    try {
      await this.request('SetCurrentProgramScene', { sceneName })
      logger.info(`Switched to scene: ${sceneName}`)
      return true
    } catch (error) {
      logger.error(`Failed to switch to scene: ${sceneName}`, error as Error)
      return false
    }
  }

  /**
   * Get current scene
   */
  getCurrentScene(): string | null {
    return this.state.currentScene
  }

  // ============================================================
  // PUBLIC API - Source Management
  // ============================================================

  /**
   * Get sources in a scene
   */
  async getSources(sceneName?: string): Promise<OBSSource[]> {
    try {
      const scene = sceneName || this.state.currentScene
      if (!scene) return []

      const result = await this.request('GetSceneItemList', { sceneName: scene })
      const sources = (result as { sceneItems: Array<{ sceneItemId: number; sourceName: string; sceneItemEnabled: boolean }> }).sceneItems.map(item => ({
        name: item.sourceName,
        type: 'unknown', // Would need GetSourceTypeInfo for actual type
        enabled: item.sceneItemEnabled,
        visible: item.sceneItemEnabled
      }))
      this.updateState({ sources })
      return sources
    } catch (error) {
      logger.error('Failed to get sources', error as Error)
      return []
    }
  }

  /**
   * Set source visibility
   */
  async setSourceVisibility(sceneName: string, sourceName: string, visible: boolean): Promise<boolean> {
    try {
      // Get scene items to find the item ID
      const sceneItems = await this.request('GetSceneItemList', { sceneName })
      const items = (sceneItems as { sceneItems: Array<{ sceneItemId: number; sourceName: string }> }).sceneItems
      const item = items.find(i => i.sourceName === sourceName)
      
      if (!item) {
        logger.warning(`Source not found: ${sourceName}`)
        return false
      }

      await this.request('SetSceneItemEnabled', {
        sceneName,
        sceneItemId: item.sceneItemId,
        sceneItemEnabled: visible
      })
      
      logger.info(`Source ${sourceName} ${visible ? 'shown' : 'hidden'}`)
      return true
    } catch (error) {
      logger.error(`Failed to set source visibility: ${sourceName}`, error as Error)
      return false
    }
  }

  /**
   * Toggle source visibility
   */
  async toggleSourceVisibility(sceneName: string, sourceName: string): Promise<boolean> {
    const sources = await this.getSources(sceneName)
    const source = sources.find(s => s.name === sourceName)
    if (source) {
      return this.setSourceVisibility(sceneName, sourceName, !source.visible)
    }
    return false
  }

  // ============================================================
  // PUBLIC API - Recording
  // ============================================================

  /**
   * Start recording
   */
  async startRecording(): Promise<boolean> {
    try {
      await this.request('StartRecording')
      logger.info('Recording started')
      return true
    } catch (error) {
      logger.error('Failed to start recording', error as Error)
      return false
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<boolean> {
    try {
      await this.request('StopRecording')
      logger.info('Recording stopped')
      return true
    } catch (error) {
      logger.error('Failed to stop recording', error as Error)
      return false
    }
  }

  /**
   * Toggle recording
   */
  async toggleRecording(): Promise<boolean> {
    if (this.state.isRecording) {
      return this.stopRecording()
    } else {
      return this.startRecording()
    }
  }

  /**
   * Get recording status
   */
  isRecording(): boolean {
    return this.state.isRecording
  }

  // ============================================================
  // PUBLIC API - Streaming
  // ============================================================

  /**
   * Start streaming
   */
  async startStreaming(): Promise<boolean> {
    try {
      await this.request('StartStream')
      logger.info('Streaming started')
      return true
    } catch (error) {
      logger.error('Failed to start streaming', error as Error)
      return false
    }
  }

  /**
   * Stop streaming
   */
  async stopStreaming(): Promise<boolean> {
    try {
      await this.request('StopStream')
      logger.info('Streaming stopped')
      return true
    } catch (error) {
      logger.error('Failed to stop streaming', error as Error)
      return false
    }
  }

  /**
   * Toggle streaming
   */
  async toggleStreaming(): Promise<boolean> {
    if (this.state.isStreaming) {
      return this.stopStreaming()
    } else {
      return this.startStreaming()
    }
  }

  /**
   * Get streaming status
   */
  isStreaming(): boolean {
    return this.state.isStreaming
  }

  // ============================================================
  // PUBLIC API - Stats
  // ============================================================

  /**
   * Get OBS stats
   */
  async getStats(): Promise<{ cpu: number; memory: number; fps: number; bitrate: number }> {
    try {
      const result = await this.request('GetStats')
      const stats = result as { cpu?: number; memory?: number; activeFps?: number; outputBitrate?: number }
      const state = {
        cpu: stats.cpu || 0,
        memory: stats.memory || 0,
        fps: stats.activeFps || 0,
        bitrate: stats.outputBitrate || 0
      }
      this.updateState({ stats: state })
      return state
    } catch (error) {
      logger.error('Failed to get stats', error as Error)
      return { cpu: 0, memory: 0, fps: 0, bitrate: 0 }
    }
  }
}
