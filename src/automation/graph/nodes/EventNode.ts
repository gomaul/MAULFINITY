import { BaseNode } from './BaseNode'
import { NodeCategory, NodePortDefinition, ConfigSchema, NodeOutput, ExecutionContext } from '../types'
import { MaulfinityEvent } from '@shared/types'

/**
 * EventNode - Base class for event trigger nodes
 *
 * Event nodes are entry points in the graph.
 * They receive MaulfinityEvent from the Event Bus
 * and emit a signal to start graph execution.
 */
export abstract class EventNode extends BaseNode {
  readonly category: NodeCategory = 'event'

  abstract readonly eventType: string

  getInputs(): NodePortDefinition[] {
    return [] // Event nodes have no inputs - they are entry points
  }

  getOutputs(): NodePortDefinition[] {
    return [
      { name: 'output', type: 'signal', required: false, label: 'Output' }
    ]
  }

  getConfigSchema(): ConfigSchema {
    return {
      eventType: {
        type: 'string',
        label: 'Event Type',
        required: true,
        default: this.eventType
      }
    }
  }

  validate(config: Record<string, unknown>): boolean {
    return true // Event nodes always match their type
  }

  async execute(
    config: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<NodeOutput> {
    const event = context.triggerEvent

    // Check if event matches this node's type
    if (event.type !== this.eventType && this.eventType !== '*') {
      return this.noop()
    }

    this.logger.debug(`Event node triggered: ${this.type} by ${event.user}`)

    return this.success('output', {
      event: event,
      eventType: event.type,
      user: event.user,
      platform: event.platform,
      payload: event.payload
    })
  }
}

// ============================================================
// CONCRETE EVENT NODES
// ============================================================

/** Gift Event Node */
export class GiftEventNode extends EventNode {
  readonly type = 'event:gift'
  readonly name = 'Gift'
  readonly description = 'Triggers when a gift is received'
  readonly icon = '🎁'
  readonly color = '#10b981'
  readonly eventType = 'gift'

  getConfigSchema(): ConfigSchema {
    return {
      ...super.getConfigSchema(),
      giftName: {
        type: 'string',
        label: 'Gift Name (optional filter)',
        placeholder: 'Leave empty for all gifts'
      }
    }
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const result = await super.execute(config, context)
    if (result.signal === '') return result

    const giftName = this.getConfig<string>(config, 'giftName', '')
    const event = context.triggerEvent
    const payload = event.payload as Record<string, unknown>

    // Optional filter by gift name
    if (giftName && payload.name !== giftName) {
      return this.noop()
    }

    return this.success('output', {
      ...result.data,
      giftName: payload.name,
      giftCount: payload.count,
      giftValue: payload.diamonds
    })
  }
}

/** Comment Event Node */
export class CommentEventNode extends EventNode {
  readonly type = 'event:comment'
  readonly name = 'Comment'
  readonly description = 'Triggers when a comment is received'
  readonly icon = '💬'
  readonly color = '#10b981'
  readonly eventType = 'comment'

  getConfigSchema(): ConfigSchema {
    return {
      ...super.getConfigSchema(),
      keyword: {
        type: 'string',
        label: 'Keyword Filter (optional)',
        placeholder: 'Leave empty for all comments'
      }
    }
  }

  async execute(config: Record<string, unknown>, context: ExecutionContext): Promise<NodeOutput> {
    const result = await super.execute(config, context)
    if (result.signal === '') return result

    const keyword = this.getConfig<string>(config, 'keyword', '')
    const event = context.triggerEvent
    const payload = event.payload as Record<string, unknown>

    // Optional keyword filter
    if (keyword) {
      const text = (payload.text as string) || ''
      if (!text.toLowerCase().includes(keyword.toLowerCase())) {
        return this.noop()
      }
    }

    return this.success('output', {
      ...result.data,
      commentText: payload.text
    })
  }
}

/** Follow Event Node */
export class FollowEventNode extends EventNode {
  readonly type = 'event:follow'
  readonly name = 'Follow'
  readonly description = 'Triggers when a new follower is detected'
  readonly icon = '👤'
  readonly color = '#10b981'
  readonly eventType = 'follow'
}

/** Join Event Node */
export class JoinEventNode extends EventNode {
  readonly type = 'event:join'
  readonly name = 'Join'
  readonly description = 'Triggers when a viewer joins the stream'
  readonly icon = '👋'
  readonly color = '#10b981'
  readonly eventType = 'join'
}

/** Like Event Node */
export class LikeEventNode extends EventNode {
  readonly type = 'event:like'
  readonly name = 'Like'
  readonly description = 'Triggers when a like is received'
  readonly icon = '❤️'
  readonly color = '#10b981'
  readonly eventType = 'like'
}

/** Super Chat Event Node */
export class SuperChatEventNode extends EventNode {
  readonly type = 'event:superchat'
  readonly name = 'Super Chat'
  readonly description = 'Triggers on YouTube Super Chat'
  readonly icon = '💰'
  readonly color = '#10b981'
  readonly eventType = 'superchat'
}

/** Membership Event Node */
export class MembershipEventNode extends EventNode {
  readonly type = 'event:membership'
  readonly name = 'Membership'
  readonly description = 'Triggers on YouTube Membership'
  readonly icon = '⭐'
  readonly color = '#10b981'
  readonly eventType = 'membership'
}

/** Custom Event Node */
export class CustomEventNode extends EventNode {
  readonly type = 'event:custom'
  readonly name = 'Custom Event'
  readonly description = 'Triggers on any custom event'
  readonly icon = '⚡'
  readonly color = '#10b981'
  readonly eventType = '*'

  getConfigSchema(): ConfigSchema {
    return {
      eventType: {
        type: 'string',
        label: 'Event Type',
        required: true,
        placeholder: 'e.g., game:spawn'
      }
    }
  }
}
