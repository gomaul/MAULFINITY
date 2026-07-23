import { EventEmitter } from 'events'
import { createServer, Server, IncomingMessage, ServerResponse } from 'http'
import { Logger } from '@services/logger'

const logger = new Logger('BrowserSourceServer')

export interface BrowserSourceConfig {
  port: number
  host?: string
}

/**
 * BrowserSourceServer - Local HTTP server for OBS Browser Source
 * 
 * Responsibilities:
 * - Serve overlay HTML/JS/CSS
 * - WebSocket endpoint for real-time updates
 * - Asset serving
 * - Default: http://localhost:19191
 */
export class BrowserSourceServer extends EventEmitter {
  private static instance: BrowserSourceServer
  private server: Server | null = null
  private config: BrowserSourceConfig
  private isRunning = false

  private constructor() {
    super()
    this.config = { port: 19191, host: 'localhost' }
  }

  static getInstance(): BrowserSourceServer {
    if (!BrowserSourceServer.instance) {
      BrowserSourceServer.instance = new BrowserSourceServer()
    }
    return BrowserSourceServer.instance
  }

  /**
   * Configure server
   */
  configure(config: Partial<BrowserSourceConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Start server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warning('Server already running')
      return
    }

    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => this.handleRequest(req, res))

      this.server.listen(this.config.port, this.config.host, () => {
        this.isRunning = true
        logger.info(`Browser Source Server started at http://${this.config.host}:${this.config.port}`)
        this.emit('started')
        resolve()
      })

      this.server.on('error', (error) => {
        logger.error('Server error', error)
        reject(error)
      })
    })
  }

  /**
   * Stop server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) return

    return new Promise((resolve) => {
      this.server!.close(() => {
        this.isRunning = false
        logger.info('Browser Source Server stopped')
        this.emit('stopped')
        resolve()
      })
    })
  }

  /**
   * Handle HTTP request
   */
  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url || '/'

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    // Route handling
    if (url === '/' || url === '/health') {
      this.handleHealth(res)
    } else if (url.startsWith('/overlay/')) {
      this.handleOverlay(url, res)
    } else if (url.startsWith('/assets/')) {
      this.handleAssets(url, res)
    } else {
      this.handleNotFound(res)
    }
  }

  /**
   * Health check endpoint
   */
  private handleHealth(res: ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }))
  }

  /**
   * Overlay endpoint
   */
  private handleOverlay(url: string, res: ServerResponse): void {
    const overlayId = url.split('/overlay/')[1]
    
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(this.generateOverlayHTML(overlayId))
  }

  /**
   * Generate overlay HTML
   */
  private generateOverlayHTML(overlayId: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maulfinity Overlay</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: transparent; overflow: hidden; }
    #overlay { width: 100vw; height: 100vh; position: relative; }
  </style>
</head>
<body>
  <div id="overlay"></div>
  <script>
    const overlayId = '${overlayId}';
    console.log('Maulfinity Overlay loaded:', overlayId);
    
    // WebSocket connection for real-time updates
    const ws = new WebSocket('ws://localhost:${this.config.port}/ws');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Update received:', data);
      // Handle overlay updates
    };
  </script>
</body>
</html>`
  }

  /**
   * Assets endpoint
   */
  private handleAssets(url: string, res: ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Asset not found')
  }

  /**
   * Not found handler
   */
  private handleNotFound(res: ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }

  /**
   * Get server URL
   */
  getUrl(): string {
    return `http://${this.config.host}:${this.config.port}`
  }

  /**
   * Check if running
   */
  isServerRunning(): boolean {
    return this.isRunning
  }
}
