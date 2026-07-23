import { appendFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { LOG_LEVELS } from '@shared/constants'

type LogLevel = keyof typeof LOG_LEVELS

export class Logger {
  private module: string
  private logsPath: string

  constructor(module: string) {
    this.module = module
    this.logsPath = join(app.getPath('userData'), 'logs')
    this.ensureLogsDirectory()
  }

  private ensureLogsDirectory(): void {
    if (!existsSync(this.logsPath)) {
      mkdirSync(this.logsPath, { recursive: true })
    }
  }

  private getLogFilePath(): string {
    const date = new Date().toISOString().split('T')[0]
    return join(this.logsPath, `${date}.log`)
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${LOG_LEVELS[level]}] [${this.module}] ${message}`
  }

  private writeToFile(formattedMessage: string): void {
    try {
      appendFileSync(this.getLogFilePath(), formattedMessage + '\n')
    } catch (error) {
      console.error('Failed to write log to file:', error)
    }
  }

  debug(message: string): void {
    const formatted = this.formatMessage('DEBUG', message)
    console.debug(formatted)
    this.writeToFile(formatted)
  }

  info(message: string): void {
    const formatted = this.formatMessage('INFO', message)
    console.log(formatted)
    this.writeToFile(formatted)
  }

  warning(message: string): void {
    const formatted = this.formatMessage('WARNING', message)
    console.warn(formatted)
    this.writeToFile(formatted)
  }

  error(message: string, error?: Error): void {
    const formatted = this.formatMessage('ERROR', message)
    console.error(formatted)
    if (error?.stack) {
      console.error(error.stack)
    }
    this.writeToFile(formatted)
    if (error?.stack) {
      this.writeToFile(error.stack)
    }
  }

  critical(message: string, error?: Error): void {
    const formatted = this.formatMessage('CRITICAL', message)
    console.error(formatted)
    if (error?.stack) {
      console.error(error.stack)
    }
    this.writeToFile(formatted)
    if (error?.stack) {
      this.writeToFile(error.stack)
    }
  }
}
