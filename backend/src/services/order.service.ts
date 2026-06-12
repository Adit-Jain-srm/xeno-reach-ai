import { supabase } from '../db/supabase.js';

export async function listOrders(params: { customer_id?: string; page?: number; page_size?: number }) {
  const { customer_id, page = 1, page_size = 20 } = params;
  const offset = (page - 1) * page_size;

  let query = supabase
    .from('orders')
    .select('*, customers(name, email)', { count: 'exact' });

  if (customer_id) query = query.eq('customer_id', customer_id);

  query = query.order('order_date', { ascending: false });
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

export async function createOrder(orderData: any) {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (error) throw error;

  // Update customer aggregates
  await updateCustomerAggregates(orderData.customer_id);

  return data;
}

export async function bulkCreateOrders(orders: any[]) {
  const results = { inserted: 0, errors: [] as any[] };
  const BATCH_SIZE = 500;

  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    const batch = orders.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('orders').insert(batch);
    if (error) {
      results.errors.push({ batch: i / BATCH_SIZE, error: error.message });
    } else {
      results.inserted += batch.length;
    }
  }

  // Update affected customer aggregates
  const customerIds = [...new Set(orders.map(o => o.customer_id))];
  for (const cid of customerIds.slice(0, 100)) {
    await updateCustomerAggregates(cid);
  }

  return results;
}

async function updateCustomerAggregates(customerId: string) {
  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount, order_date')
    .eq('customer_id', customerId)
    .order('order_date', { ascending: false });

  if (!orders || orders.length === 0) return;

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const avgOrderValue = totalSpent / orders.length;

  await supabase
    .from('customers')
    .update({
      total_orders: orders.length,
      total_spent: Math.round(totalSpent * 100) / 100,
      avg_order_value: Math.round(avgOrderValue * 100) / 100,
      last_purchase_at: orders[0].order_date,
      first_purchase_at: orders[orders.length - 1].order_date,
    })
    .eq('id', customerId);
}
