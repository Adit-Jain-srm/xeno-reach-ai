import { supabase } from '../db/supabase.js';
import type { PaginatedResponse } from '../../../shared/types.js';

interface ListCustomersParams {
  page?: number;
  page_size?: number;
  city?: string;
  loyalty_tier?: string;
  preferred_channel?: string;
  min_spent?: number;
  max_spent?: number;
  min_orders?: number;
  search?: string;
  segment_tag?: string;
  inactive_days?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export async function listCustomers(params: ListCustomersParams): Promise<PaginatedResponse<any>> {
  const {
    page = 1,
    page_size = 20,
    city,
    loyalty_tier,
    preferred_channel,
    min_spent,
    max_spent,
    min_orders,
    search,
    segment_tag,
    inactive_days,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = params;

  const offset = (page - 1) * page_size;

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' });

  if (city) query = query.eq('city', city);
  if (loyalty_tier) query = query.eq('loyalty_tier', loyalty_tier);
  if (preferred_channel) query = query.eq('preferred_channel', preferred_channel);
  if (min_spent) query = query.gte('total_spent', min_spent);
  if (max_spent) query = query.lte('total_spent', max_spent);
  if (min_orders) query = query.gte('total_orders', min_orders);
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  if (segment_tag) query = query.contains('segment_tags', [segment_tag]);
  if (inactive_days) {
    const cutoff = new Date(Date.now() - inactive_days * 24 * 60 * 60 * 1000).toISOString();
    query = query.lt('last_purchase_at', cutoff);
  }

  query = query.order(sort_by, { ascending: sort_order === 'asc' });
  query = query.range(offset, offset + page_size - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    page_size,
    total_pages: Math.ceil((count || 0) / page_size),
  };
}

export async function getCustomer(id: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getCustomerWithOrders(id: string) {
  const [customerResult, ordersResult] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    supabase.from('orders').select('*').eq('customer_id', id).order('order_date', { ascending: false }).limit(50),
  ]);

  if (customerResult.error) throw customerResult.error;

  return {
    ...customerResult.data,
    orders: ordersResult.data || [],
  };
}

export async function createCustomer(data: any) {
  const { data: customer, error } = await supabase
    .from('customers')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return customer;
}

export async function bulkCreateCustomers(customers: any[]) {
  const results = { inserted: 0, errors: [] as any[] };

  const BATCH_SIZE = 500;
  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    const batch = customers.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('customers').upsert(batch, { onConflict: 'external_id' });
    if (error) {
      results.errors.push({ batch: i / BATCH_SIZE, error: error.message });
    } else {
      results.inserted += batch.length;
    }
  }

  return results;
}

export async function getCustomerTimeline(customerId: string) {
  const { data, error } = await supabase
    .from('communications')
    .select('id, campaign_id, channel, message_content, current_status, created_at, campaigns(name)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}
