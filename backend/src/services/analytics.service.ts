import { supabase } from '../db/supabase.js';

export async function getOverviewMetrics() {
  const [customersResult, campaignsResult, communicationsResult] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('campaigns').select('id, status', { count: 'exact' }).in('status', ['running', 'completed']),
    supabase.from('communications').select('id', { count: 'exact', head: true }),
  ]);

  const totalCustomers = customersResult.count || 0;
  const totalCampaigns = campaignsResult.count || 0;
  const totalCommunications = communicationsResult.count || 0;

  // Get aggregate stats across all campaigns
  const { data: stats } = await supabase
    .from('campaign_stats')
    .select('total_sent, total_delivered, total_failed, total_opened, total_read, total_clicked');

  let aggStats = { sent: 0, delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0 };
  if (stats) {
    for (const s of stats) {
      aggStats.sent += s.total_sent || 0;
      aggStats.delivered += s.total_delivered || 0;
      aggStats.failed += s.total_failed || 0;
      aggStats.opened += s.total_opened || 0;
      aggStats.read += s.total_read || 0;
      aggStats.clicked += s.total_clicked || 0;
    }
  }

  return {
    total_customers: totalCustomers,
    total_campaigns: totalCampaigns,
    total_communications: totalCommunications,
    overall_delivery_rate: aggStats.sent > 0 ? Math.round((aggStats.delivered / aggStats.sent) * 10000) / 100 : 0,
    overall_open_rate: aggStats.delivered > 0 ? Math.round((aggStats.opened / aggStats.delivered) * 10000) / 100 : 0,
    overall_click_rate: aggStats.read > 0 ? Math.round((aggStats.clicked / aggStats.read) * 10000) / 100 : 0,
    aggregate: aggStats,
  };
}

export async function getChannelPerformance() {
  const { data, error } = await supabase
    .from('communications')
    .select('channel, current_status');

  if (error) throw error;

  const channels: Record<string, Record<string, number>> = {};
  for (const comm of data || []) {
    if (!channels[comm.channel]) {
      channels[comm.channel] = { total: 0, delivered: 0, read: 0, clicked: 0, failed: 0 };
    }
    channels[comm.channel].total++;
    if (['delivered', 'read', 'clicked'].includes(comm.current_status)) channels[comm.channel].delivered++;
    if (['read', 'clicked'].includes(comm.current_status)) channels[comm.channel].read++;
    if (comm.current_status === 'clicked') channels[comm.channel].clicked++;
    if (comm.current_status === 'failed') channels[comm.channel].failed++;
  }

  return Object.entries(channels).map(([channel, stats]) => ({
    channel,
    total: stats.total,
    delivery_rate: stats.total > 0 ? Math.round((stats.delivered / stats.total) * 10000) / 100 : 0,
    read_rate: stats.delivered > 0 ? Math.round((stats.read / stats.delivered) * 10000) / 100 : 0,
    click_rate: stats.read > 0 ? Math.round((stats.clicked / stats.read) * 10000) / 100 : 0,
    failure_rate: stats.total > 0 ? Math.round((stats.failed / stats.total) * 10000) / 100 : 0,
  }));
}
