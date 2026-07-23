import { Action } from '../ActionEngine'
import { MaulfinityEvent } from '@core/event-bus/types'
import { Logger } from '@services/logger'

const logger = new Logger('SoundAction')

/**
 * SoundAction - Plays audio files
 *
 * Config:
 *   file: string - Path to audio file
 *   volume: number - Volume 0-100 (default: 80)
 *   loop: boolean - Loop the audio (default: false)
 *   category: string - Audio category for mixing (default: 'default')
 */
export class SoundAction implements Action {
  name = 'sound'

  validate(config: Record<string, unknown>): boolean {
    if (!config.file || typeof config.file !== 'string') {
      logger.error('SoundAction: file is required and must be a string')
      return false
    }
    if (config.volume !== undefined) {
      const vol = config.volume as number
      if (typeof vol !== 'number' || vol < 0 || vol > 100) {
        logger.error('SoundAction: volume must be a number between 0 and 100')
        return false
      }
    }
    return true
  }

  async execute(config: Record<string, unknown>, _event: MaulfinityEvent): Promise<void> {
    const file = config.file as string
    const volume = ((config.volume as number) || 80) / 100
    const loop = (config.loop as boolean) || false
    const category = (config.category as string) || 'default'

    logger.info(`SoundAction: file=${file} volume=${volume} loop=${loop} category=${category}`)

    // Placeholder for actual audio playback
    // In production, this would use:
    // - Howler.js for web audio
    // - Electron's Web Audio API
    // - or a native audio library
    logger.info(`Playing sound: ${file} at volume ${volume * 100}%${loop ? ' (looping)' : ''}`)

    // Simulate playback duration for non-looping sounds
    if (!loop) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    logger.info(`SoundAction completed: ${file}`)
  }

  settings(): Record<string, unknown> {
    return {
      file: { type: 'file', accept: 'audio/*', required: true, label: 'Audio File' },
      volume: { type: 'number', default: 80, min: 0, max: 100, label: 'Volume (%)' },
      loop: { type: 'boolean', default: false, label: 'Loop' },
      category: { type: 'select', options: ['default', 'music', 'sfx', 'voice'], default: 'default', label: 'Category' }
    }
  }
}
