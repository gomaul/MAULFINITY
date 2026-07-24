import { LOG_LEVELS } from '@shared/constants'

type LogLevel = keyof typeof LOG_LEVELS

export class Logger {
  private module: string

  constructor(module: string) {
    this.module = module
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${LOG_LEVELS[level]}] [${this.module}] ${message}`
  }

  debug(message: string, ...args: unknown[]): void {
    console.debug(this.formatMessage('DEBUG', message), ...args)
  }

  info(message: string): void {
    console.log(this.formatMessage('INFO', message))
  }

  warning(message: string): void {
    console.warn(this.formatMessage('WARNING', message))
  }

  error(message: string, error?: Error): void {
    console.error(this.formatMessage('ERROR', message))
    if (error) {
      console.error(error.stack)
    }
  }

  critical(message: string, error?: Error): void {
    console.error(this.formatMessage('CRITICAL', message))
    if (error) {
      console.error(error.stack)
    }
  }
}
