import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createWindow } from './window'
import { registerIpcHandlers } from './ipc'
import { ApplicationCore } from '@core/application/ApplicationCore'
import { Logger } from '@services/logger'

let mainWindow: BrowserWindow | null = null
let isShuttingDown = false

const logger = new Logger('Main')
const appCore = ApplicationCore.getInstance()

async function bootstrap(): Promise<void> {
  logger.info('Starting Maulfinity...')

  app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.maulfinity')

    // Initialize Application Core (handles DB, EventBus, Config, etc.)
    await appCore.start()
    logger.info('Application Core started')

    // Create main window
    mainWindow = createWindow()

    // Register IPC handlers
    registerIpcHandlers()
    logger.info('IPC handlers registered')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    app.on('activate', function () {
      // macOS: re-create window when dock icon is clicked
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    logger.info('Maulfinity started successfully')
  })

  // Graceful shutdown (guard against multiple calls)
  app.on('before-quit', async () => {
    if (isShuttingDown) return
    isShuttingDown = true
    logger.info('Application quitting...')
    await appCore.shutdown()
  })

  // Quit when all windows are closed (except on macOS)
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

bootstrap().catch(console.error)
