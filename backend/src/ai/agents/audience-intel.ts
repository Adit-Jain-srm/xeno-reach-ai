import { AzureOpenAI } from 'openai';
import { supabase } from '../../db/supabase.js';

const openai = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview',
});

const MODEL = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

export interface AudienceIntelligence {
  health_metrics: {
    active_rate: number;
    churn_risk_count: number;
    high_value_count: number;
    growth_rate: string;
  };
  segments_detected: Array<{
    name: string;
    size: number;
    description: string;
    recommended_action: string;
    urgency: 'high' | 'medium' | 'low';
  }>;
  opportunities: string[];
}

export async function analyzeAudienceHealth(): Promise<AudienceIntelligence> {
  const { data: customers } = await supabase
    .from('customers')
    .select('loyalty_tier, engagement_score, total_spent, total_orders, days_since_last_order, city, preferred_channel');

  if (!customers || customers.length === 0) {
    return {
      health_metrics: { active_rate: 0, churn_risk_count: 0, high_value_count: 0, growth_rate: '0%' },
      segments_detected: [],
      opportunities: [],
    };
  }

  // Compute metrics
  const total = customers.length;
  const activeCount = customers.filter((c: any) => (c.days_since_last_order || 999) < 30).length;
  const churnRisk = customers.filter((c: any) => (c.days_since_last_order || 0) > 30).length;
  const highValue = customers.filter((c: any) => c.loyalty_tier === 'platinum' || c.loyalty_tier === 'gold').length;

  // Tier distribution
  const tiers: Record<string, number> = {};
  const cities: Record<string, number> = {};
  const channels: Record<string, number> = {};

  for (const c of customers) {
    tiers[c.loyalty_tier] = (tiers[c.loyalty_tier] || 0) + 1;
    if (c.city) cities[c.city] = (cities[c.city] || 0) + 1;
    if (c.preferred_channel) channels[c.preferred_channel] = (channels[c.preferred_channel] || 0) + 1;
  }

  // Auto-detect opportunity segments
  const segments: AudienceIntelligence['segments_detected'] = [];

  if (churnRisk > total * 0.1) {
    segments.push({
      name: 'Churning Customers',
      size: churnRisk,
      description: `${churnRisk} customers haven't ordered in 30+ days`,
      recommended_action: 'Win-back campaign with personalized offer',
      urgency: 'high',
    });
  }

  const dormantGold = customers.filter((c: any) =>
    (c.loyalty_tier === 'gold' || c.loyalty_tier === 'platinum') &&
    (c.days_since_last_order || 0) > 14
  ).length;

  if (dormantGold > 0) {
    segments.push({
      name: 'Dormant High-Value',
      size: dormantGold,
      description: `${dormantGold} gold/platinum members inactive 14+ days`,
      recommended_action: 'Exclusive loyalty reward to re-engage',
      urgency: 'high',
    });
  }

  const lowEngagement = customers.filter((c: any) =>
    Number(c.engagement_score) < 0.3 && c.total_orders > 3
  ).length;

  if (lowEngagement > 50) {
    segments.push({
      name: 'Disengaged Repeat Buyers',
      size: lowEngagement,
      description: `${lowEngagement} customers with 3+ orders but low engagement`,
      recommended_action: 'Re-engagement campaign emphasizing new menu items',
      urgency: 'medium',
    });
  }

  const topSpenders = customers.filter((c: any) => c.total_spent > 5000).length;
  segments.push({
    name: 'VIP Segment',
    size: topSpenders,
    description: `${topSpenders} customers with ₹5,000+ lifetime spend`,
    recommended_action: 'Premium experience or early access offers',
    urgency: 'low',
  });

  return {
    health_metrics: {
      active_rate: Math.round((activeCount / total) * 100),
      churn_risk_count: churnRisk,
      high_value_count: highValue,
      growth_rate: '+12%', // Placeholder — would compute from new customers this month
    },
    segments_detected: segments,
    opportunities: [
      `${Math.round((channels.whatsapp || 0) / total * 100)}% prefer WhatsApp — high delivery rates expected`,
      `Top city: ${Object.entries(cities).sort(([, a], [, b]) => b - a)[0]?.[0]} (${Object.entries(cities).sort(([, a], [, b]) => b - a)[0]?.[1]} customers)`,
      `${Math.round(highValue / total * 100)}% are gold/platinum — strong loyalty base`,
    ],
  };
}
