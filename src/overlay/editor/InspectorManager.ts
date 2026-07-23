import { EventEmitter } from 'events'
import { Logger } from '@services/logger'
import { EditorObject, InspectorProperty } from './types'

const logger = new Logger('InspectorManager')

/**
 * InspectorManager - Manages inspector panel properties
 */
export class InspectorManager extends EventEmitter {
  private static instance: InspectorManager
  private selectedObject: EditorObject | null = null

  private constructor() {
    super()
  }

  static getInstance(): InspectorManager {
    if (!InspectorManager.instance) {
      InspectorManager.instance = new InspectorManager()
    }
    return InspectorManager.instance
  }

  /**
   * Set selected object
   */
  setSelectedObject(object: EditorObject | null): void {
    this.selectedObject = object
    this.emit('selectionChanged', object)
  }

  /**
   * Get properties for object
   */
  getProperties(object: EditorObject): InspectorProperty[] {
    const properties: InspectorProperty[] = []

    // Transform properties
    properties.push(
      {
        key: 'position.x',
        label: 'X',
        type: 'number',
        value: object.transform.position.x,
        min: 0,
        step: 1
      },
      {
        key: 'position.y',
        label: 'Y',
        type: 'number',
        value: object.transform.position.y,
        min: 0,
        step: 1
      },
      {
        key: 'size.width',
        label: 'Width',
        type: 'number',
        value: object.transform.size.width,
        min: 10,
        step: 1
      },
      {
        key: 'size.height',
        label: 'Height',
        type: 'number',
        value: object.transform.size.height,
        min: 10,
        step: 1
      },
      {
        key: 'rotation',
        label: 'Rotation',
        type: 'number',
        value: object.transform.rotation,
        min: 0,
        max: 360,
        step: 1
      }
    )

    // Appearance properties
    properties.push(
      {
        key: 'opacity',
        label: 'Opacity',
        type: 'slider',
        value: object.opacity,
        min: 0,
        max: 1,
        step: 0.01
      },
      {
        key: 'visible',
        label: 'Visible',
        type: 'boolean',
        value: object.visible
      },
      {
        key: 'locked',
        label: 'Locked',
        type: 'boolean',
        value: object.locked
      }
    )

    // Type-specific properties
    switch (object.type) {
      case 'rectangle':
        properties.push(
          {
            key: 'config.fillColor',
            label: 'Fill Color',
            type: 'color',
            value: (object.config as Record<string, unknown>).fillColor || '#3b82f6'
          },
          {
            key: 'config.strokeColor',
            label: 'Stroke Color',
            type: 'color',
            value: (object.config as Record<string, unknown>).strokeColor || ''
          },
          {
            key: 'config.strokeWidth',
            label: 'Stroke Width',
            type: 'number',
            value: (object.config as Record<string, unknown>).strokeWidth || 0,
            min: 0,
            max: 20,
            step: 1
          }
        )
        break

      case 'circle':
        properties.push(
          {
            key: 'config.fillColor',
            label: 'Fill Color',
            type: 'color',
            value: (object.config as Record<string, unknown>).fillColor || '#8b5cf6'
          },
          {
            key: 'config.strokeColor',
            label: 'Stroke Color',
            type: 'color',
            value: (object.config as Record<string, unknown>).strokeColor || ''
          }
        )
        break

      case 'text':
        properties.push(
          {
            key: 'config.text',
            label: 'Text',
            type: 'string',
            value: (object.config as Record<string, unknown>).text || 'Text'
          },
          {
            key: 'config.fontSize',
            label: 'Font Size',
            type: 'number',
            value: (object.config as Record<string, unknown>).fontSize || 24,
            min: 8,
            max: 200,
            step: 1
          },
          {
            key: 'config.fontFamily',
            label: 'Font Family',
            type: 'select',
            value: (object.config as Record<string, unknown>).fontFamily || 'Inter',
            options: [
              { label: 'Inter', value: 'Inter' },
              { label: 'Arial', value: 'Arial' },
              { label: 'Helvetica', value: 'Helvetica' },
              { label: 'Times New Roman', value: 'Times New Roman' },
              { label: 'Courier New', value: 'Courier New' }
            ]
          },
          {
            key: 'config.color',
            label: 'Text Color',
            type: 'color',
            value: (object.config as Record<string, unknown>).color || '#ffffff'
          }
        )
        break

      case 'image':
        properties.push(
          {
            key: 'config.src',
            label: 'Image Source',
            type: 'string',
            value: (object.config as Record<string, unknown>).src || ''
          }
        )
        break
    }

    // Animation properties
    if (object.animation) {
      properties.push(
        {
          key: 'animation.type',
          label: 'Animation',
          type: 'select',
          value: object.animation.type,
          options: [
            { label: 'None', value: '' },
            { label: 'Fade', value: 'fade' },
            { label: 'Move', value: 'move' },
            { label: 'Scale', value: 'scale' },
            { label: 'Rotate', value: 'rotate' },
            { label: 'Bounce', value: 'bounce' },
            { label: 'Shake', value: 'shake' }
          ]
        },
        {
          key: 'animation.duration',
          label: 'Duration (s)',
          type: 'number',
          value: object.animation.duration,
          min: 0.1,
          max: 10,
          step: 0.1
        },
        {
          key: 'animation.delay',
          label: 'Delay (s)',
          type: 'number',
          value: object.animation.delay || 0,
          min: 0,
          max: 10,
          step: 0.1
        },
        {
          key: 'animation.loop',
          label: 'Loop',
          type: 'boolean',
          value: object.animation.loop || false
        }
      )
    }

    return properties
  }

  /**
   * Update property
   */
  updateProperty(objectId: string, key: string, value: unknown): void {
    this.emit('propertyChanged', { objectId, key, value })
  }

  /**
   * Get current object
   */
  getSelectedObject(): EditorObject | null {
    return this.selectedObject
  }
}
