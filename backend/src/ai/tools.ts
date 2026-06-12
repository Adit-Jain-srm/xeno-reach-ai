import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export const AGENT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'query_customers',
      description: 'Query the customer database with filters. Returns matching customers with count. Use for audience identification and segmentation.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'Filter by city (Mumbai, Delhi, Bangalore, Pune, Hyderabad, Chennai)' },
          loyalty_tier: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum'], description: 'Filter by loyalty tier' },
          min_spent: { type: 'number', description: 'Minimum total amount spent (₹)' },
          max_spent: { type: 'number', description: 'Maximum total amount spent (₹)' },
          min_orders: { type: 'number', description: 'Minimum number of orders' },
          inactive_days: { type: 'number', description: 'Customers inactive for at least N days' },
          preferred_channel: { type: 'string', enum: ['whatsapp', 'sms', 'email', 'rcs'], description: 'Filter by preferred communication channel' },
          segment_tag: { type: 'string', description: 'Filter by segment tag (e.g., churning, high_value, active, loyal, vip, lapsed)' },
          limit: { type: 'number', description: 'Max results to return (default 10 for preview)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_audience',
      description: 'Get detailed analytics about a customer segment: demographics breakdown, channel preferences, spending patterns, engagement distribution.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          loyalty_tier: { type: 'string' },
          min_spent: { type: 'number' },
          inactive_days: { type: 'number' },
          segment_tag: { type: 'string' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_message',
      description: 'Generate a personalized marketing message for a campaign. Returns message text with personalization placeholders.',
      parameters: {
        type: 'object',
        properties: {
          goal: { type: 'string', description: 'Campaign goal/context' },
          channel: { type: 'string', enum: ['whatsapp', 'sms', 'email', 'rcs'], description: 'Target channel (affects length/format)' },
          tone: { type: 'string', enum: ['friendly', 'urgent', 'premium', 'casual', 'professional'], description: 'Message tone' },
          offer: { type: 'string', description: 'Specific offer/CTA if any' },
          audience_description: { type: 'string', description: 'Description of target audience for personalization context' },
        },
        required: ['goal', 'channel', 'tone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recommend_channels',
      description: 'Analyze an audience and recommend the best communication channels based on their preferences and engagement patterns.',
      parameters: {
        type: 'object',
        properties: {
          audience_filter: {
            type: 'object',
            description: 'Filter criteria to identify the audience',
            properties: {
              city: { type: 'string' },
              loyalty_tier: { type: 'string' },
              inactive_days: { type: 'number' },
              segment_tag: { type: 'string' },
            },
          },
        },
        required: ['audience_filter'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'estimate_performance',
      description: 'Predict campaign performance metrics (delivery rate, open rate, click rate) based on channel, audience, and historical data.',
      parameters: {
        type: 'object',
        properties: {
          channel: { type: 'string', enum: ['whatsapp', 'sms', 'email', 'rcs'] },
          audience_size: { type: 'number' },
          audience_engagement: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Average engagement level of target audience' },
        },
        required: ['channel', 'audience_size'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_campaign',
      description: 'Create a campaign with the specified configuration. Returns the campaign ID for launching.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Campaign name' },
          goal: { type: 'string', description: 'Campaign goal' },
          audience_filter: {
            type: 'object',
            description: 'Filter config to resolve audience',
            properties: {
              conditions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    operator: { type: 'string', enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'contains'] },
                    value: {},
                  },
                },
              },
              logic: { type: 'string', enum: ['AND', 'OR'] },
            },
          },
          channels: { type: 'array', items: { type: 'string', enum: ['whatsapp', 'sms', 'email', 'rcs'] } },
          message_template: { type: 'string', description: 'Message body with {{name}} personalization' },
        },
        required: ['name', 'goal', 'audience_filter', 'channels', 'message_template'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_past_campaigns',
      description: 'Get past campaign results for learning and comparison. Returns campaign names, channels, audience sizes, and performance metrics.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of past campaigns to retrieve (default 5)' },
          status: { type: 'string', enum: ['completed', 'failed', 'running'] },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'launch_campaign',
      description: 'Launch an approved campaign. Sends communications to all audience members through the channel service.',
      parameters: {
        type: 'object',
        properties: {
          campaign_id: { type: 'string', description: 'UUID of the campaign to launch' },
        },
        required: ['campaign_id'],
      },
    },
  },
];
