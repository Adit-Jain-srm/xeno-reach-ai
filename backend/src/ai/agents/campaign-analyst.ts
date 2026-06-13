import { AzureOpenAI } from 'openai';
import { supabase } from '../../db/supabase.js';

const openai = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview',
});

const MODEL = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

export interface CampaignAnalysis {
  summary: string;
  delivery_health: {
    score: number; // 0-100
    verdict: 'excellent' | 'good' | 'fair' | 'poor';
    bottleneck?: string;
  };
  audience_insights: string[];
  channel_verdict: {
    channel: string;
    effectiveness: string;
    recommendation: string;
  };
  failure_analysis?: {
    failure_rate: number;
    pattern: string;
    fix_recommendation: string;
  };
  next_campaign_suggestions: Array<{
    title: string;
    audience: string;
    reasoning: string;
  }>;
  timing_analysis?: string;
}

export async function analyzeCampaignPerformance(campaignId: string): Promise<CampaignAnalysis> {
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, campaign_stats(*)')
    .eq('id', campaignId)
    .single();

  if (!campaign) throw new Error('Campaign not found');

  const stats = campaign.campaign_stats?.[0];
  if (!stats || stats.total_sent === 0) {
    return {
      summary: 'Campaign has not sent any messages yet.',
      delivery_health: { score: 0, verdict: 'poor' },
      audience_insights: ['No delivery data available'],
      channel_verdict: { channel: campaign.channels?.[0] || 'unknown', effectiveness: 'No data', recommendation: 'Launch the campaign first' },
      next_campaign_suggestions: [],
    };
  }

  // Get communication-level data for pattern analysis
  const { data: comms } = await supabase
    .from('communications')
    .select('channel, current_status, created_at, customers(city, loyalty_tier, engagement_score)')
    .eq('campaign_id', campaignId)
    .limit(1000);

  // Compute pattern metrics
  const statusDist: Record<string, number> = {};
  const cityPerf: Record<string, { sent: number; delivered: number }> = {};
  const tierPerf: Record<string, { sent: number; delivered: number }> = {};

  for (const c of comms || []) {
    statusDist[c.current_status] = (statusDist[c.current_status] || 0) + 1;
    const city = (c as any).customers?.city || 'unknown';
    const tier = (c as any).customers?.loyalty_tier || 'unknown';

    if (!cityPerf[city]) cityPerf[city] = { sent: 0, delivered: 0 };
    cityPerf[city].sent++;
    if (['delivered', 'read', 'clicked'].includes(c.current_status)) cityPerf[city].delivered++;

    if (!tierPerf[tier]) tierPerf[tier] = { sent: 0, delivered: 0 };
    tierPerf[tier].sent++;
    if (['delivered', 'read', 'clicked'].includes(c.current_status)) tierPerf[tier].delivered++;
  }

  const analysisPrompt = `You are a campaign performance analyst for BrewPulse (premium coffee chain, India).

Analyze this campaign and return a JSON object with actionable insights.

Campaign: "${campaign.name}"
Goal: ${campaign.goal || 'Not specified'}
Channel: ${campaign.channels?.join(', ')}
Audience: ${campaign.audience_count} recipients

Delivery Stats:
- Sent: ${stats.total_sent}
- Delivered: ${stats.total_delivered} (${Math.round((stats.total_delivered / stats.total_sent) * 100)}%)
- Opened: ${stats.total_opened} (${stats.total_delivered > 0 ? Math.round((stats.total_opened / stats.total_delivered) * 100) : 0}%)
- Read: ${stats.total_read}
- Clicked: ${stats.total_clicked} (${stats.total_opened > 0 ? Math.round((stats.total_clicked / stats.total_opened) * 100) : 0}%)
- Failed: ${stats.total_failed} (${Math.round((stats.total_failed / stats.total_sent) * 100)}%)

Status Distribution: ${JSON.stringify(statusDist)}
Performance by City: ${JSON.stringify(cityPerf)}
Performance by Loyalty Tier: ${JSON.stringify(tierPerf)}

Respond with ONLY valid JSON matching this structure:
{
  "summary": "1-2 sentence plain-English summary of how this campaign performed",
  "delivery_health": { "score": <0-100>, "verdict": "<excellent|good|fair|poor>", "bottleneck": "<where messages drop off, if any>" },
  "audience_insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "channel_verdict": { "channel": "<channel used>", "effectiveness": "<brief assessment>", "recommendation": "<what to do differently>" },
  "failure_analysis": { "failure_rate": <percentage>, "pattern": "<what's causing failures>", "fix_recommendation": "<how to fix>" },
  "next_campaign_suggestions": [
    { "title": "<campaign name>", "audience": "<who to target>", "reasoning": "<why this follows from the data>" }
  ],
  "timing_analysis": "<observation about timing if relevant>"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: analysisPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const analysis = JSON.parse(content) as CampaignAnalysis;

    // Store analysis result
    await supabase
      .from('campaigns')
      .update({ ai_reasoning: JSON.stringify(analysis) })
      .eq('id', campaignId);

    return analysis;
  } catch (err) {
    console.error('[Campaign Analyst] Error:', (err as Error).message);
    return buildFallbackAnalysis(campaign, stats);
  }
}

function buildFallbackAnalysis(campaign: any, stats: any): CampaignAnalysis {
  const deliveryRate = stats.total_sent > 0 ? (stats.total_delivered / stats.total_sent) * 100 : 0;
  const openRate = stats.total_delivered > 0 ? (stats.total_opened / stats.total_delivered) * 100 : 0;
  const failRate = stats.total_sent > 0 ? (stats.total_failed / stats.total_sent) * 100 : 0;

  return {
    summary: `Campaign delivered ${Math.round(deliveryRate)}% of messages with ${Math.round(openRate)}% open rate.`,
    delivery_health: {
      score: Math.round(deliveryRate),
      verdict: deliveryRate > 90 ? 'excellent' : deliveryRate > 75 ? 'good' : deliveryRate > 50 ? 'fair' : 'poor',
      bottleneck: failRate > 10 ? 'High failure rate at delivery stage' : undefined,
    },
    audience_insights: [
      `${stats.total_delivered} of ${stats.total_sent} messages reached recipients`,
      `${stats.total_opened} recipients opened the message (${Math.round(openRate)}%)`,
    ],
    channel_verdict: {
      channel: campaign.channels?.[0] || 'unknown',
      effectiveness: deliveryRate > 90 ? 'Strong' : 'Needs improvement',
      recommendation: deliveryRate < 80 ? 'Consider switching to WhatsApp for better delivery' : 'Current channel performing well',
    },
    next_campaign_suggestions: [{
      title: 'Follow-up to non-openers',
      audience: `${stats.total_delivered - stats.total_opened} recipients who received but didn't open`,
      reasoning: 'Re-engage with different subject line or offer',
    }],
  };
}
