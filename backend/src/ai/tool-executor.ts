import { supabase } from '../db/supabase.js';
import * as campaignService from '../services/campaign.service.js';

export async function executeToolCall(name: string, args: any): Promise<any> {
  switch (name) {
    case 'query_customers': return queryCustomers(args);
    case 'analyze_audience': return analyzeAudience(args);
    case 'generate_message': return generateMessage(args);
    case 'recommend_channels': return recommendChannels(args);
    case 'estimate_performance': return estimatePerformance(args);
    case 'create_campaign': return createCampaign(args);
    case 'get_past_campaigns': return getPastCampaigns(args);
    case 'launch_campaign': return launchCampaign(args);
    default: return { error: `Unknown tool: ${name}` };
  }
}

async function queryCustomers(args: any) {
  let query = supabase.from('customers').select('id, name, email, city, loyalty_tier, preferred_channel, total_orders, total_spent, engagement_score, last_purchase_at', { count: 'exact' });

  if (args.city) query = query.eq('city', args.city);
  if (args.loyalty_tier) query = query.eq('loyalty_tier', args.loyalty_tier);
  if (args.preferred_channel) query = query.eq('preferred_channel', args.preferred_channel);
  if (args.min_spent) query = query.gte('total_spent', args.min_spent);
  if (args.max_spent) query = query.lte('total_spent', args.max_spent);
  if (args.min_orders) query = query.gte('total_orders', args.min_orders);
  if (args.segment_tag) query = query.contains('segment_tags', [args.segment_tag]);
  if (args.inactive_days) {
    const cutoff = new Date(Date.now() - args.inactive_days * 24 * 60 * 60 * 1000).toISOString();
    query = query.lt('last_purchase_at', cutoff);
  }

  const limit = args.limit || 10;
  query = query.order('engagement_score', { ascending: false }).limit(limit);

  const { data, count, error } = await query;
  if (error) return { error: error.message };

  return {
    total_matching: count || 0,
    sample: data || [],
    showing: Math.min(limit, data?.length || 0),
  };
}

async function analyzeAudience(args: any) {
  let query = supabase.from('customers').select('city, loyalty_tier, preferred_channel, total_spent, total_orders, engagement_score');

  if (args.city) query = query.eq('city', args.city);
  if (args.loyalty_tier) query = query.eq('loyalty_tier', args.loyalty_tier);
  if (args.min_spent) query = query.gte('total_spent', args.min_spent);
  if (args.segment_tag) query = query.contains('segment_tags', [args.segment_tag]);
  if (args.inactive_days) {
    const cutoff = new Date(Date.now() - args.inactive_days * 24 * 60 * 60 * 1000).toISOString();
    query = query.lt('last_purchase_at', cutoff);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { total: 0, message: 'No customers match these criteria' };

  // Compute analytics
  const cityDist: Record<string, number> = {};
  const tierDist: Record<string, number> = {};
  const channelDist: Record<string, number> = {};
  let totalSpent = 0;
  let totalOrders = 0;
  let totalEngagement = 0;

  for (const c of data) {
    cityDist[c.city] = (cityDist[c.city] || 0) + 1;
    tierDist[c.loyalty_tier] = (tierDist[c.loyalty_tier] || 0) + 1;
    channelDist[c.preferred_channel] = (channelDist[c.preferred_channel] || 0) + 1;
    totalSpent += Number(c.total_spent);
    totalOrders += c.total_orders;
    totalEngagement += Number(c.engagement_score);
  }

  return {
    total_customers: data.length,
    avg_spend: Math.round(totalSpent / data.length),
    avg_orders: Math.round((totalOrders / data.length) * 10) / 10,
    avg_engagement: Math.round((totalEngagement / data.length) * 100) / 100,
    city_distribution: cityDist,
    tier_distribution: tierDist,
    channel_preferences: channelDist,
    recommended_channel: Object.entries(channelDist).sort(([, a], [, b]) => b - a)[0]?.[0] || 'whatsapp',
  };
}

async function generateMessage(args: any) {
  const { goal, channel, tone, offer, audience_description } = args;

  const channelLimits: Record<string, number> = {
    whatsapp: 160, sms: 140, email: 500, rcs: 200,
  };

  const maxLength = channelLimits[channel] || 200;
  const toneGuide: Record<string, string> = {
    friendly: 'warm and conversational',
    urgent: 'creating urgency with time-limited language',
    premium: 'sophisticated and exclusive',
    casual: 'relaxed and fun',
    professional: 'clear and business-like',
  };

  // Generate message based on parameters (simplified — in production, call GPT for this)
  let message = '';
  const name = '{{name}}';

  if (tone === 'urgent' && offer) {
    message = `⏰ ${name}, last chance! ${offer}. Don't miss out — offer expires tonight at BrewPulse!`;
  } else if (tone === 'premium') {
    message = `${name}, as a valued BrewPulse member, you have exclusive access: ${offer || goal}. Visit your nearest store to redeem.`;
  } else if (tone === 'friendly') {
    message = `Hey ${name}! 👋 ${goal}. ${offer ? `Here's something special for you: ${offer}` : 'We\'d love to see you at BrewPulse!'} ☕`;
  } else {
    message = `Hi ${name}, ${goal}. ${offer || 'Visit BrewPulse today!'} — BrewPulse`;
  }

  if (message.length > maxLength) {
    message = message.substring(0, maxLength - 3) + '...';
  }

  return {
    message,
    channel,
    character_count: message.length,
    max_length: maxLength,
    tone: toneGuide[tone] || tone,
    personalization_fields: ['name'],
  };
}

async function recommendChannels(args: any) {
  const filter = args.audience_filter || {};
  let query = supabase.from('customers').select('preferred_channel, engagement_score');

  if (filter.city) query = query.eq('city', filter.city);
  if (filter.loyalty_tier) query = query.eq('loyalty_tier', filter.loyalty_tier);
  if (filter.segment_tag) query = query.contains('segment_tags', [filter.segment_tag]);
  if (filter.inactive_days) {
    const cutoff = new Date(Date.now() - filter.inactive_days * 24 * 60 * 60 * 1000).toISOString();
    query = query.lt('last_purchase_at', cutoff);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { recommendation: 'whatsapp', reason: 'Default for empty audience' };

  const channelCounts: Record<string, { count: number; avgEngagement: number }> = {};
  for (const c of data) {
    if (!channelCounts[c.preferred_channel]) {
      channelCounts[c.preferred_channel] = { count: 0, avgEngagement: 0 };
    }
    channelCounts[c.preferred_channel].count++;
    channelCounts[c.preferred_channel].avgEngagement += Number(c.engagement_score);
  }

  // Normalize engagement scores
  for (const ch of Object.values(channelCounts)) {
    ch.avgEngagement = ch.count > 0 ? ch.avgEngagement / ch.count : 0;
  }

  const ranked = Object.entries(channelCounts)
    .map(([channel, stats]) => ({
      channel,
      audience_share: Math.round((stats.count / data.length) * 100),
      avg_engagement: Math.round(stats.avgEngagement * 100) / 100,
      score: stats.count * stats.avgEngagement,
    }))
    .sort((a, b) => b.score - a.score);

  return {
    total_audience: data.length,
    recommendations: ranked,
    primary_channel: ranked[0]?.channel || 'whatsapp',
    reasoning: `${ranked[0]?.channel} preferred by ${ranked[0]?.audience_share}% with ${ranked[0]?.avg_engagement} avg engagement`,
  };
}

async function estimatePerformance(args: any) {
  const { channel, audience_size, audience_engagement } = args;

  const baseRates: Record<string, { delivery: number; open: number; click: number }> = {
    whatsapp: { delivery: 0.95, open: 0.75, click: 0.40 },
    sms: { delivery: 0.92, open: 0.60, click: 0.15 },
    email: { delivery: 0.88, open: 0.35, click: 0.12 },
    rcs: { delivery: 0.80, open: 0.50, click: 0.25 },
  };

  const engagementMultiplier: Record<string, number> = {
    high: 1.2, medium: 1.0, low: 0.7,
  };

  const rates = baseRates[channel] || baseRates.whatsapp;
  const multiplier = engagementMultiplier[audience_engagement || 'medium'] || 1.0;

  return {
    channel,
    audience_size,
    estimated_delivery: Math.round(audience_size * rates.delivery),
    estimated_opens: Math.round(audience_size * rates.delivery * rates.open * multiplier),
    estimated_clicks: Math.round(audience_size * rates.delivery * rates.open * rates.click * multiplier),
    delivery_rate: `${Math.round(rates.delivery * 100)}%`,
    open_rate: `${Math.round(rates.open * multiplier * 100)}%`,
    click_rate: `${Math.round(rates.click * multiplier * 100)}%`,
    confidence: audience_engagement === 'high' ? 'high' : 'medium',
  };
}

async function createCampaign(args: any) {
  const { name, goal, audience_filter, channels, message_template } = args;

  const campaign = await campaignService.createCampaign({
    name,
    goal,
    audience_filter: audience_filter || { conditions: [], logic: 'AND' },
    channels: channels || ['whatsapp'],
    message_template: { body: message_template, personalization_fields: ['name'] },
    ai_reasoning: `AI-generated campaign for goal: ${goal}`,
    created_by: 'ai_agent',
  });

  return campaign;
}

async function getPastCampaigns(args: any) {
  const { limit = 5, status } = args;

  let query = supabase
    .from('campaigns')
    .select('id, name, goal, status, channels, audience_count, ai_confidence_score, created_at, campaign_stats(*)');

  if (status) query = query.eq('status', status);
  query = query.order('created_at', { ascending: false }).limit(limit);

  const { data, error } = await query;
  if (error) return { error: error.message };

  return {
    campaigns: (data || []).map((c: any) => ({
      name: c.name,
      goal: c.goal,
      status: c.status,
      channels: c.channels,
      audience_count: c.audience_count,
      confidence_score: c.ai_confidence_score,
      stats: c.campaign_stats?.[0] || null,
    })),
  };
}

async function launchCampaign(args: any) {
  const { campaign_id } = args;
  try {
    const result = await campaignService.launchCampaign(campaign_id);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
