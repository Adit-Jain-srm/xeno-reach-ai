import { supabase } from '../../db/supabase.js';

export interface DeliveryAlert {
  type: 'failure_spike' | 'stalled_delivery' | 'channel_degraded' | 'campaign_complete';
  severity: 'info' | 'warning' | 'critical';
  campaign_id: string;
  message: string;
  data: Record<string, any>;
  timestamp: string;
}

const FAILURE_THRESHOLD = 0.15; // 15% failure rate triggers alert
const STALL_WINDOW_MS = 60000; // No progress for 60s = stalled

export async function checkDeliveryHealth(campaignId: string): Promise<DeliveryAlert[]> {
  const alerts: DeliveryAlert[] = [];

  const { data: stats } = await supabase
    .from('campaign_stats')
    .select('*')
    .eq('campaign_id', campaignId)
    .single();

  if (!stats || stats.total_sent === 0) return alerts;

  const failureRate = stats.total_failed / stats.total_sent;
  const deliveryRate = stats.total_delivered / stats.total_sent;
  const totalProcessed = stats.total_delivered + stats.total_failed;
  const pendingRate = (stats.total_sent - totalProcessed) / stats.total_sent;

  // Failure spike detection
  if (failureRate > FAILURE_THRESHOLD) {
    alerts.push({
      type: 'failure_spike',
      severity: failureRate > 0.3 ? 'critical' : 'warning',
      campaign_id: campaignId,
      message: `${Math.round(failureRate * 100)}% failure rate detected — ${stats.total_failed} of ${stats.total_sent} messages failed`,
      data: { failure_rate: failureRate, total_failed: stats.total_failed },
      timestamp: new Date().toISOString(),
    });
  }

  // Campaign completion detection
  if (pendingRate === 0 && stats.total_sent > 0) {
    alerts.push({
      type: 'campaign_complete',
      severity: 'info',
      campaign_id: campaignId,
      message: `Campaign fully delivered: ${stats.total_delivered} delivered, ${stats.total_failed} failed out of ${stats.total_sent} sent`,
      data: { delivery_rate: deliveryRate, total_sent: stats.total_sent },
      timestamp: new Date().toISOString(),
    });

    // Mark campaign as completed
    await supabase
      .from('campaigns')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('status', 'running');
  }

  return alerts;
}

export async function getDeliveryVelocity(campaignId: string): Promise<{
  messages_per_second: number;
  estimated_completion_seconds: number;
  progress_percent: number;
}> {
  const { data: stats } = await supabase
    .from('campaign_stats')
    .select('total_sent, total_delivered, total_failed, updated_at')
    .eq('campaign_id', campaignId)
    .single();

  if (!stats) return { messages_per_second: 0, estimated_completion_seconds: 0, progress_percent: 0 };

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('started_at, audience_count')
    .eq('id', campaignId)
    .single();

  const totalProcessed = stats.total_delivered + stats.total_failed;
  const progress = stats.total_sent > 0 ? totalProcessed / stats.total_sent : 0;

  let velocity = 0;
  let etaSeconds = 0;

  if (campaign?.started_at) {
    const elapsed = (Date.now() - new Date(campaign.started_at).getTime()) / 1000;
    velocity = elapsed > 0 ? totalProcessed / elapsed : 0;
    const remaining = stats.total_sent - totalProcessed;
    etaSeconds = velocity > 0 ? remaining / velocity : 0;
  }

  return {
    messages_per_second: Math.round(velocity * 10) / 10,
    estimated_completion_seconds: Math.round(etaSeconds),
    progress_percent: Math.round(progress * 100),
  };
}
