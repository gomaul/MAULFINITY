import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'

const logger = new Logger('AssetLibrary')

export type AssetType = 'image' | 'gif' | 'video' | 'audio' | 'font' | 'lottie' | 'svg'

export interface Asset {
  id: string
  name: string
  type: AssetType
  path: string
  category: string
  thumbnail?: string
  metadata: Record<string, unknown>
}

export interface AssetCategory {
  name: string
  icon: string
  count: number
}

const ASSET_EXTENSIONS: Record<AssetType, string[]> = {
  image: ['.png', '.jpg', '.jpeg', '.webp', '.bmp'],
  gif: ['.gif'],
  video: ['.mp4', '.webm', '.mov', '.avi'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
  font: ['.ttf', '.otf', '.woff', '.woff2'],
  lottie: ['.json'],
  svg: ['.svg']
}

/**
 * AssetLibrary - Manages assets for overlay editor
 * 
 * Responsibilities:
 * - Import images, GIF, video, audio
 * - Search assets
 * - Categories
 * - Preview
 * - Drag & Drop to canvas
 */
export class AssetLibrary extends EventEmitter {
  private static instance: AssetLibrary
  private assets: Map<string, Asset> = new Map()
  private categories: Map<string, AssetCategory> = new Map()
  private searchQuery: string = ''
  private selectedCategory: string | null = null

  private constructor() {
    super()
    this.initializeCategories()
  }

  static getInstance(): AssetLibrary {
    if (!AssetLibrary.instance) {
      AssetLibrary.instance = new AssetLibrary()
    }
    return AssetLibrary.instance
  }

  /**
   * Initialize default categories
   */
  private initializeCategories(): void {
    const defaultCategories: AssetCategory[] = [
      { name: 'All', icon: '📁', count: 0 },
      { name: 'Images', icon: '🖼️', count: 0 },
      { name: 'GIFs', icon: '🎞️', count: 0 },
      { name: 'Videos', icon: '🎬', count: 0 },
      { name: 'Audio', icon: '🔊', count: 0 },
      { name: 'Fonts', icon: '🔤', count: 0 },
      { name: 'Lottie', icon: '✨', count: 0 },
      { name: 'SVG', icon: '🎨', count: 0 }
    ]

    defaultCategories.forEach(cat => {
      this.categories.set(cat.name, cat)
    })
  }

  /**
   * Import asset from file path
   */
  async importAsset(filePath: string, category?: string): Promise<Asset> {
    const fileName = filePath.split(/[/\\]/).pop() || 'unknown'
    const ext = extname(filePath).toLowerCase()
    const type = this.getAssetType(ext)
    const assetCategory = category || this.getCategoryFromType(type)

    const asset: Asset = {
      id: this.generateId(),
      name: fileName,
      type,
      path: filePath,
      category: assetCategory,
      metadata: {
        importedAt: new Date().toISOString(),
        size: 0
      }
    }

    // Get file size
    try {
      const stats = await stat(filePath)
      asset.metadata.size = stats.size
    } catch (error) {
      logger.warning(`Failed to get file stats: ${filePath}`)
    }

    this.assets.set(asset.id, asset)
    this.updateCategoryCount(assetCategory)

    logger.info(`Asset imported: ${fileName} (${type})`)
    this.emit('assetImported', asset)

    return asset
  }

  /**
   * Import multiple assets
   */
  async importAssets(filePaths: string[], category?: string): Promise<Asset[]> {
    const assets: Asset[] = []
    for (const path of filePaths) {
      const asset = await this.importAsset(path, category)
      assets.push(asset)
    }
    return assets
  }

  /**
   * Import from folder
   */
  async importFolder(folderPath: string, recursive: boolean = false): Promise<Asset[]> {
    const assets: Asset[] = []
    
    try {
      const entries = await readdir(folderPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(folderPath, entry.name)
        
        if (entry.isDirectory() && recursive) {
          const subAssets = await this.importFolder(fullPath, recursive)
          assets.push(...subAssets)
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase()
          if (this.isSupportedExtension(ext)) {
            const asset = await this.importAsset(fullPath)
            assets.push(asset)
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to import folder: ${folderPath}`, error as Error)
    }

    return assets
  }

  /**
   * Get asset by ID
   */
  getAsset(id: string): Asset | undefined {
    return this.assets.get(id)
  }

  /**
   * Get all assets
   */
  getAssets(): Asset[] {
    return Array.from(this.assets.values())
  }

  /**
   * Get assets by category
   */
  getAssetsByCategory(category: string): Asset[] {
    if (category === 'All') return this.getAssets()
    return this.getAssets().filter(a => a.category === category)
  }

  /**
   * Search assets
   */
  searchAssets(query: string): Asset[] {
    const lowerQuery = query.toLowerCase()
    return this.getAssets().filter(a => 
      a.name.toLowerCase().includes(lowerQuery) ||
      a.type.toLowerCase().includes(lowerQuery) ||
      a.category.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Set search query
   */
  setSearchQuery(query: string): void {
    this.searchQuery = query
    this.emit('searchChanged', query)
  }

  /**
   * Set selected category
   */
  setSelectedCategory(category: string | null): void {
    this.selectedCategory = category
    this.emit('categoryChanged', category)
  }

  /**
   * Get filtered assets
   */
  getFilteredAssets(): Asset[] {
    let assets = this.getAssets()

    if (this.selectedCategory && this.selectedCategory !== 'All') {
      assets = assets.filter(a => a.category === this.selectedCategory)
    }

    if (this.searchQuery) {
      const lowerQuery = this.searchQuery.toLowerCase()
      assets = assets.filter(a => 
        a.name.toLowerCase().includes(lowerQuery)
      )
    }

    return assets
  }

  /**
   * Get categories with counts
   */
  getCategories(): AssetCategory[] {
    return Array.from(this.categories.values())
  }

  /**
   * Delete asset
   */
  deleteAsset(id: string): boolean {
    const asset = this.assets.get(id)
    if (!asset) return false

    this.assets.delete(id)
    this.updateCategoryCount(asset.category, -1)

    logger.info(`Asset deleted: ${asset.name}`)
    this.emit('assetDeleted', asset)

    return true
  }

  /**
   * Get asset type from extension
   */
  private getAssetType(ext: string): AssetType {
    for (const [type, extensions] of Object.entries(ASSET_EXTENSIONS)) {
      if (extensions.includes(ext)) {
        return type as AssetType
      }
    }
    return 'image' // default
  }

  /**
   * Check if extension is supported
   */
  private isSupportedExtension(ext: string): boolean {
    return Object.values(ASSET_EXTENSIONS).some(extensions => extensions.includes(ext))
  }

  /**
   * Get category from asset type
   */
  private getCategoryFromType(type: AssetType): string {
    const categoryMap: Record<AssetType, string> = {
      image: 'Images',
      gif: 'GIFs',
      video: 'Videos',
      audio: 'Audio',
      font: 'Fonts',
      lottie: 'Lottie',
      svg: 'SVG'
    }
    return categoryMap[type] || 'Images'
  }

  /**
   * Update category count
   */
  private updateCategoryCount(category: string, delta: number = 1): void {
    const cat = this.categories.get(category)
    if (cat) {
      cat.count += delta
      const allCat = this.categories.get('All')
      if (allCat) {
        allCat.count += delta
      }
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get thumbnail for asset
   */
  getThumbnail(asset: Asset): string | null {
    if (asset.thumbnail) return asset.thumbnail
    
    // Generate thumbnail based on type
    switch (asset.type) {
      case 'image':
      case 'gif':
        return asset.path
      case 'video':
        return null // Would need video thumbnail generation
      case 'audio':
        return null // Would need audio waveform visualization
      case 'font':
        return null // Would need font preview
      default:
        return null
    }
  }

  /**
   * Clear all assets
   */
  clear(): void {
    this.assets.clear()
    this.categories.forEach(cat => cat.count = 0)
    this.emit('assetsCleared')
  }
}
