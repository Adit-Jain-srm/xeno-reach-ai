import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export const AGENT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'query_customers',
      description: 'Query the customer database with filters. Returns matching customers with count. Use for audience identification and segmentation. IMPORTANT: Use sort_by and limit to get "top N" audiences (e.g., top 100 spenders = sort_by: total_spent, limit: 100).',
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
          sort_by: { type: 'string', enum: ['total_spent', 'total_orders', 'engagement_score', 'last_purchase_at'], description: 'Sort field (descending). Use total_spent for top spenders, engagement_score for most engaged.' },
          limit: { type: 'number', description: 'EXACT number of customers to target. For "top 100 spenders" use 100. This becomes the campaign audience size.' },
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
      description: 'Create a campaign with the specified configuration. You MUST set audience_count to the exact number from query_customers (use the audience_count field from query result). Returns the campaign ID for launching.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Campaign name' },
          goal: { type: 'string', description: 'Campaign goal' },
          audience_count: { type: 'number', description: 'EXACT number of customers to target. MUST match the audience_count returned by query_customers.' },
          audience_filter: {
            type: 'object',
            description: 'Filter config to resolve audience at launch time',
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
        required: ['name', 'goal', 'audience_count', 'audience_filter', 'channels', 'message_template'],
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
  {
    type: 'function',
    function: {
      name: 'refine_message',
      description: 'Refine a campaign message with a specific direction (hook type, tone shift, length adjustment). Returns 3 variants ranked by predicted engagement. Use when the user wants to customize or improve a message.',
      parameters: {
        type: 'object',
        properties: {
          original_message: { type: 'string', description: 'The current message to refine' },
          direction: { type: 'string', description: 'What to change: e.g. "make it more urgent", "add scarcity", "shorter", "more premium", "add social proof", "curiosity hook", "FOMO", "benefit-first"' },
          channel: { type: 'string', enum: ['whatsapp', 'sms', 'email', 'rcs'] },
          audience_context: { type: 'string', description: 'Brief description of who receives this (e.g., "gold tier, inactive 30 days, prefer whatsapp")' },
        },
        required: ['original_message', 'direction', 'channel'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ab_test_hooks',
      description: 'Generate 3 distinct message hooks for A/B testing. Each uses a different psychological trigger (scarcity, social proof, curiosity, exclusivity, loss aversion, reciprocity). Returns hooks ranked by predicted click-through rate.',
      parameters: {
        type: 'object',
        properties: {
          goal: { type: 'string', description: 'Campaign goal/what action you want' },
          audience: { type: 'string', description: 'Who is receiving this' },
          channel: { type: 'string', enum: ['whatsapp', 'sms', 'email', 'rcs'] },
          brand_tone: { type: 'string', enum: ['premium', 'friendly', 'urgent', 'playful', 'minimal'], description: 'Brand voice' },
        },
        required: ['goal', 'audience', 'channel'],
      },
    },
  },
];
