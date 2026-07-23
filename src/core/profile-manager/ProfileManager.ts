import { Logger } from '@services/logger'

const logger = new Logger('ProfileManager')

export interface ProfileSettings {
  [key: string]: unknown
}

export class ProfileManager {
  private currentProfileId: string | null = null

  /**
   * Set the active profile
   */
  setActiveProfile(profileId: string): void {
    this.currentProfileId = profileId
    logger.info(`Active profile set to: ${profileId}`)
  }

  /**
   * Get the active profile ID
   */
  getActiveProfileId(): string | null {
    return this.currentProfileId
  }

  /**
   * Clear the active profile
   */
  clearActiveProfile(): void {
    this.currentProfileId = null
  }
}
