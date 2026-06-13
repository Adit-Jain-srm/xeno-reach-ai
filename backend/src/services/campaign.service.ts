import { supabase } from '../db/supabase.js';
import { getAudienceCount } from './segment.service.js';
import type { FilterConfig } from '../../../shared/types.js';

export async function listCampaigns(params: { status?: string; page?: number; page_size?: number }) {
  const { status, page = 1, page_size = 20 } = params;
  const offset = (page - 1) * page_size;

  let query = supabase
    .from('campaigns')
    .select('*, campaign_stats(*)', { count: 'exact' });

  if (status) query = query.eq('status', status);

  query = query.order('created_at', { ascending: false });
  query = query.range(offset, offset + page_size - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  // Auto-complete stale running campaigns
  const campaigns = data || [];
  for (const c of campaigns) {
    if (c.status === 'running') {
      const stats = c.campaign_stats?.[0];
      if (stats && stats.total_sent > 0) {
        const totalProcessed = (stats.total_delivered || 0) + (stats.total_failed || 0);
        if (totalProcessed >= stats.total_sent) {
          await supabase
            .from('campaigns')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', c.id);
          c.status = 'completed';
        }
      }
    }
  }

  return {
    data: campaigns,
    total: count || 0,
    page,
    page_size,
    total_pages: Math.ceil((count || 0) / page_size),
  };
}

export async function getCampaign(id: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, campaign_stats(*)')
    .eq('id', id)
    .single();

  if (error) throw error;

  // Auto-detect stale "running" campaigns that are actually complete
  if (data?.status === 'running') {
    const stats = data.campaign_stats?.[0];
    if (stats && stats.total_sent > 0) {
      const totalProcessed = (stats.total_delivered || 0) + (stats.total_failed || 0);
      if (totalProcessed >= stats.total_sent) {
        await supabase
          .from('campaigns')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', id);
        data.status = 'completed';
        data.completed_at = new Date().toISOString();
      }
    }
  }

  return data;
}

export async function createCampaign(campaignData: any) {
  let audienceCount = campaignData.audience_count || 0;
  if (campaignData.audience_filter && !audienceCount) {
    audienceCount = await getAudienceCount(campaignData.audience_filter);
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({ ...campaignData, audience_count: audienceCount })
    .select()
    .single();

  if (error) throw error;

  // Initialize campaign_stats row
  await supabase.from('campaign_stats').insert({ campaign_id: data.id });

  return data;
}

export async function updateCampaign(id: string, updates: any) {
  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function launchCampaign(campaignId: string) {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error('Campaign not found');
  if (campaign.status !== 'draft') throw new Error(`Cannot launch campaign in ${campaign.status} status`);

  // Resolve audience
  const filterConfig: FilterConfig = campaign.audience_filter;
  if (!filterConfig || !filterConfig.conditions?.length) {
    throw new Error('Campaign has no audience filter defined');
  }

  let query = supabase.from('customers').select('id, name, email, phone, preferred_channel');

  const { conditions, logic } = filterConfig;
  for (const condition of conditions) {
    const { field, operator, value } = condition;
    switch (operator) {
      case 'eq': query = query.eq(field, value); break;
      case 'neq': query = query.neq(field, value); break;
      case 'gt': query = query.gt(field, value); break;
      case 'gte': query = query.gte(field, value); break;
      case 'lt': query = query.lt(field, value); break;
      case 'lte': query = query.lte(field, value); break;
      case 'in': query = query.in(field, Array.isArray(value) ? value : [value]); break;
      case 'contains': query = query.ilike(field, `%${value}%`); break;
    }
  }

  const { data: audience, error: audienceError } = await query;
  if (audienceError) throw audienceError;
  if (!audience || audience.length === 0) throw new Error('No customers match the audience filter');

  // Update campaign status
  await updateCampaign(campaignId, {
    status: 'running',
    started_at: new Date().toISOString(),
    audience_count: audience.length,
  });

  // Create communications for each customer
  const channels = campaign.channels || ['whatsapp'];
  const messageTemplate = campaign.message_template?.body || 'Hello {{name}}!';

  const communications = audience.map((customer: any) => {
    const channel = channels.length === 1
      ? channels[0]
      : customer.preferred_channel || channels[0];

    const personalizedMessage = messageTemplate
      .replace(/\{\{name\}\}/g, customer.name || 'there')
      .replace(/\{\{email\}\}/g, customer.email || '');

    return {
      campaign_id: campaignId,
      customer_id: customer.id,
      channel,
      message_content: personalizedMessage,
      personalization_data: { name: customer.name },
      current_status: 'queued',
      idempotency_key: `${campaignId}:${customer.id}`,
    };
  });

  // Insert communications in batches
  const BATCH_SIZE = 500;
  for (let i = 0; i < communications.length; i += BATCH_SIZE) {
    const batch = communications.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('communications').insert(batch);
    if (error) throw error;
  }

  // Fetch actual communication IDs from DB (handle Supabase 1000 row limit)
  const allInsertedComms: Array<{ id: string; customer_id: string }> = [];
  let fetchOffset = 0;
  const FETCH_PAGE_SIZE = 1000;
  while (true) {
    const { data: batch } = await supabase
      .from('communications')
      .select('id, customer_id')
      .eq('campaign_id', campaignId)
      .range(fetchOffset, fetchOffset + FETCH_PAGE_SIZE - 1);
    if (!batch || batch.length === 0) break;
    allInsertedComms.push(...batch);
    if (batch.length < FETCH_PAGE_SIZE) break;
    fetchOffset += FETCH_PAGE_SIZE;
  }

  // Build dispatch messages with real DB UUIDs
  const queueMessages = audience.map((customer: any) => {
    const channel = channels.length === 1
      ? channels[0]
      : customer.preferred_channel || channels[0];
    return {
      communication_id: `${campaignId}:${customer.id}`,
      campaign_id: campaignId,
      recipient: { customer_id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
      channel,
      message: { content: messageTemplate.replace(/\{\{name\}\}/g, customer.name || 'there') },
    };
  });

  // Dispatch messages to channel service (direct, not via in-memory queue)
  const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3002';
  console.log(`[Launch] Dispatching ${allInsertedComms.length} messages to ${channelServiceUrl}`);

  if (allInsertedComms.length > 0) {
    const customerToCommId = new Map(allInsertedComms.map(c => [c.customer_id, c.id]));
    const dispatchMessages = queueMessages.map((msg: any) => ({
      ...msg,
      communication_id: customerToCommId.get(msg.recipient.customer_id) || msg.communication_id,
    }));

    // Dispatch in batches of 50 with rate limiting
    const DISPATCH_BATCH = 50;
    let dispatched = 0;
    let failed = 0;

    for (let i = 0; i < dispatchMessages.length; i += DISPATCH_BATCH) {
      const batch = dispatchMessages.slice(i, i + DISPATCH_BATCH);
      const results = await Promise.allSettled(
        batch.map(async (msg: any) => {
          const response = await fetch(`${channelServiceUrl}/api/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              communication_id: msg.communication_id,
              campaign_id: msg.campaign_id,
              recipient: msg.recipient,
              channel: msg.channel,
              message: msg.message,
            }),
            signal: AbortSignal.timeout(10000),
          });
          if (!response.ok && response.status !== 202) {
            throw new Error(`Channel service returned ${response.status}`);
          }
        })
      );

      dispatched += results.filter(r => r.status === 'fulfilled').length;
      failed += results.filter(r => r.status === 'rejected').length;

      if (i + DISPATCH_BATCH < dispatchMessages.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`[Launch] Dispatch complete: ${dispatched} sent, ${failed} failed`);
  }

  return {
    campaign_id: campaignId,
    audience_count: audience.length,
    communications_created: communications.length,
    status: 'running',
  };
}

export async function getCampaignCommunications(campaignId: string, page = 1, pageSize = 50) {
  const offset = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from('communications')
    .select('*, customers(name, email, phone)', { count: 'exact' })
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    page_size: pageSize,
    total_pages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getCampaignStats(campaignId: string) {
  const { data, error } = await supabase
    .from('campaign_stats')
    .select('*')
    .eq('campaign_id', campaignId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
