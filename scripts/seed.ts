import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { generateName, generateEmail, generatePhone } from './seed-data/names.js';
import { pickCity } from './seed-data/cities.js';
import { MENU_ITEMS } from './seed-data/menu.js';

config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const CUSTOMER_COUNT = 10000;
const ORDERS_PER_CUSTOMER_AVG = 5;
const BATCH_SIZE = 500;

// Weighted random helper
function weightedRandom<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let rand = Math.random() * total;
  for (const item of items) {
    rand -= item.weight;
    if (rand <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pickLoyaltyTier(): string {
  return weightedRandom([
    { value: 'bronze', weight: 50 },
    { value: 'silver', weight: 25 },
    { value: 'gold', weight: 15 },
    { value: 'platinum', weight: 10 },
  ]);
}

function pickChannel(): string {
  return weightedRandom([
    { value: 'whatsapp', weight: 45 },
    { value: 'email', weight: 25 },
    { value: 'sms', weight: 20 },
    { value: 'rcs', weight: 10 },
  ]);
}

function pickPaymentMethod(): string {
  return weightedRandom([
    { value: 'upi', weight: 45 },
    { value: 'card', weight: 30 },
    { value: 'cash', weight: 15 },
    { value: 'wallet', weight: 10 },
  ]);
}

function generateSegmentTags(tier: string, daysInactive: number, totalSpent: number): string[] {
  const tags: string[] = [];
  if (daysInactive > 30) tags.push('churning');
  if (daysInactive > 60) tags.push('lapsed');
  if (daysInactive <= 7) tags.push('active');
  if (totalSpent > 5000) tags.push('high_value');
  if (totalSpent > 15000) tags.push('vip');
  if (tier === 'platinum' || tier === 'gold') tags.push('loyal');
  return tags;
}

function calculateEngagement(totalOrders: number, daysInactive: number, totalSpent: number): number {
  let score = 0.5;
  // Recency factor (0-0.3)
  if (daysInactive <= 7) score += 0.3;
  else if (daysInactive <= 14) score += 0.2;
  else if (daysInactive <= 30) score += 0.1;
  else if (daysInactive > 60) score -= 0.2;
  // Frequency factor (0-0.2)
  if (totalOrders > 20) score += 0.2;
  else if (totalOrders > 10) score += 0.15;
  else if (totalOrders > 5) score += 0.1;
  // Monetary factor (0-0.15)
  if (totalSpent > 10000) score += 0.15;
  else if (totalSpent > 5000) score += 0.1;
  else if (totalSpent > 2000) score += 0.05;

  return Math.max(0, Math.min(1, score));
}

function generateOrders(customerId: string, city: string, orderCount: number) {
  const now = new Date();
  const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const orders = [];

  for (let i = 0; i < orderCount; i++) {
    const orderDate = randomDate(yearAgo, now);
    const itemCount = weightedRandom([
      { value: 1, weight: 40 },
      { value: 2, weight: 35 },
      { value: 3, weight: 20 },
      { value: 4, weight: 5 },
    ]);

    const items = [];
    let totalAmount = 0;
    for (let j = 0; j < itemCount; j++) {
      const menuItem = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
      const quantity = Math.random() > 0.85 ? 2 : 1;
      items.push({
        name: menuItem.name,
        category: menuItem.category,
        quantity,
        price: menuItem.price,
      });
      totalAmount += menuItem.price * quantity;
    }

    const { store } = pickCity();
    orders.push({
      customer_id: customerId,
      items: JSON.stringify(items),
      total_amount: totalAmount,
      store_location: store,
      order_date: orderDate.toISOString(),
      payment_method: pickPaymentMethod(),
    });
  }

  return orders.sort((a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime());
}

async function seedCustomers() {
  console.log(`Seeding ${CUSTOMER_COUNT} customers...`);

  const customers = [];
  const allOrders: any[] = [];

  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const { name } = generateName();
    const { city } = pickCity();
    const loyaltyTier = pickLoyaltyTier();
    const preferredChannel = pickChannel();

    // Determine order patterns based on tier
    let orderCount: number;
    switch (loyaltyTier) {
      case 'platinum': orderCount = randomBetween(15, 40); break;
      case 'gold': orderCount = randomBetween(8, 20); break;
      case 'silver': orderCount = randomBetween(4, 12); break;
      default: orderCount = randomBetween(1, 6); break;
    }

    const customerId = crypto.randomUUID();
    const orders = generateOrders(customerId, city, orderCount);
    const totalSpent = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;

    const firstOrder = orders.length > 0 ? orders[0].order_date : null;
    const lastOrder = orders.length > 0 ? orders[orders.length - 1].order_date : null;
    const daysInactive = lastOrder
      ? Math.floor((Date.now() - new Date(lastOrder).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Pick favorite items from their orders
    const itemFrequency: Record<string, number> = {};
    for (const order of orders) {
      const items = JSON.parse(order.items);
      for (const item of items) {
        itemFrequency[item.name] = (itemFrequency[item.name] || 0) + 1;
      }
    }
    const favoriteItems = Object.entries(itemFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);

    const segmentTags = generateSegmentTags(loyaltyTier, daysInactive, totalSpent);
    const engagementScore = calculateEngagement(orderCount, daysInactive, totalSpent);

    customers.push({
      id: customerId,
      external_id: `BP-${String(i + 1).padStart(5, '0')}`,
      name,
      email: generateEmail(name),
      phone: generatePhone(),
      city,
      loyalty_tier: loyaltyTier,
      segment_tags: segmentTags,
      preferred_channel: preferredChannel,
      favorite_items: JSON.stringify(favoriteItems),
      first_purchase_at: firstOrder,
      last_purchase_at: lastOrder,
      total_orders: orderCount,
      total_spent: totalSpent,
      avg_order_value: Math.round(avgOrderValue * 100) / 100,
      engagement_score: Math.round(engagementScore * 1000) / 1000,
    });

    allOrders.push(...orders);
  }

  // Insert customers in batches
  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    const batch = customers.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('customers').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error inserting customers batch ${i / BATCH_SIZE + 1}:`, error.message);
      throw error;
    }
    process.stdout.write(`\r  Customers: ${Math.min(i + BATCH_SIZE, customers.length)}/${customers.length}`);
  }
  console.log('\n  Customers done.');

  // Insert orders in batches
  console.log(`Seeding ${allOrders.length} orders...`);
  for (let i = 0; i < allOrders.length; i += BATCH_SIZE) {
    const batch = allOrders.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('orders').insert(batch);
    if (error) {
      console.error(`Error inserting orders batch ${i / BATCH_SIZE + 1}:`, error.message);
      throw error;
    }
    if ((i / BATCH_SIZE) % 20 === 0) {
      process.stdout.write(`\r  Orders: ${Math.min(i + BATCH_SIZE, allOrders.length)}/${allOrders.length}`);
    }
  }
  console.log('\n  Orders done.');

  return customers;
}

async function seedCampaigns(customers: any[]) {
  console.log('Seeding 5 historical campaigns...');

  const campaigns = [
    {
      name: 'Monday Morning Boost',
      goal: 'Drive weekday morning traffic with a coffee discount',
      status: 'running',
      audience_count: 1200,
      channels: ['whatsapp'],
      message_template: JSON.stringify({ body: 'Good morning {{name}}! Start your week right with 15% off your favorite {{favorite_item}}. Show this message at any BrewPulse store today!', personalization_fields: ['name', 'favorite_item'] }),
      ai_reasoning: 'Targeted active customers who typically order on weekday mornings. WhatsApp chosen for highest read rates during commute hours.',
      ai_confidence_score: 0.87,
      created_by: 'ai_agent',
      started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      name: 'Loyalty Tier Upgrade',
      goal: 'Encourage silver-tier customers to reach gold status',
      status: 'completed',
      audience_count: 2500,
      channels: ['email'],
      message_template: JSON.stringify({ body: 'Hi {{name}}, you are just {{orders_away}} orders away from Gold status! Gold members get 20% off every order and free birthday drinks.', personalization_fields: ['name', 'orders_away'] }),
      ai_reasoning: 'Email selected for detailed messaging. Silver tier customers with 6-8 orders targeted — close to upgrade threshold.',
      ai_confidence_score: 0.82,
      created_by: 'ai_agent',
      started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      name: 'Win Back Lapsed Customers',
      goal: 'Re-engage customers who have not ordered in 30+ days',
      status: 'completed',
      audience_count: 3000,
      channels: ['sms'],
      message_template: JSON.stringify({ body: 'Hey {{name}}, we miss you at BrewPulse! Here is a special 25% off code just for you: COMEBACK25. Valid this week only.', personalization_fields: ['name'] }),
      ai_reasoning: 'SMS for urgency and directness. Churning segment (30-60 days inactive) with high previous engagement.',
      ai_confidence_score: 0.74,
      created_by: 'ai_agent',
      started_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      name: 'New Seasonal Menu Launch',
      goal: 'Announce summer cold brew collection to engaged customers',
      status: 'completed',
      audience_count: 4500,
      channels: ['whatsapp', 'email'],
      message_template: JSON.stringify({ body: '🧊 {{name}}, our Summer Cold Brew Collection is here! Try the new Coconut Cold Brew or Mango Smoothie at your nearest store. First 100 orders get a free upgrade!', personalization_fields: ['name'] }),
      ai_reasoning: 'Multi-channel for maximum reach. Targeted active + high-value customers likely to try new items.',
      ai_confidence_score: 0.91,
      created_by: 'ai_agent',
      started_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      name: 'Weekend Brunch Special',
      goal: 'Promote new brunch menu items on weekends',
      status: 'failed',
      audience_count: 500,
      channels: ['rcs'],
      message_template: JSON.stringify({ body: 'This weekend only: Try our new Pancake Stack + Cold Brew combo for just ₹499! Book your table at {{nearest_store}}.', personalization_fields: ['nearest_store'] }),
      ai_reasoning: 'RCS chosen for rich media. Small test audience to validate new channel.',
      ai_confidence_score: 0.65,
      created_by: 'ai_agent',
      started_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const { data: insertedCampaigns, error } = await supabase
    .from('campaigns')
    .insert(campaigns)
    .select();

  if (error) {
    console.error('Error inserting campaigns:', error.message);
    throw error;
  }

  // Generate communications and events for completed/running campaigns
  for (const campaign of insertedCampaigns!) {
    const audienceSize = campaign.audience_count;
    const sampleCustomers = customers
      .sort(() => Math.random() - 0.5)
      .slice(0, audienceSize);

    const channel = campaign.channels[0];
    const communications = sampleCustomers.map((customer: any) => ({
      campaign_id: campaign.id,
      customer_id: customer.id,
      channel,
      message_content: `Personalized message for ${customer.name}`,
      personalization_data: JSON.stringify({ name: customer.name }),
      current_status: campaign.status === 'failed' ? 'failed' : getRandomFinalStatus(channel),
      idempotency_key: `${campaign.id}:${customer.id}`,
    }));

    // Insert in batches
    for (let i = 0; i < communications.length; i += BATCH_SIZE) {
      const batch = communications.slice(i, i + BATCH_SIZE);
      const { error: commError } = await supabase.from('communications').insert(batch);
      if (commError) {
        console.error(`Error inserting communications for ${campaign.name}:`, commError.message);
        break;
      }
    }

    // Create campaign_stats
    const stats = calculateCampaignStats(communications);
    await supabase.from('campaign_stats').upsert({
      campaign_id: campaign.id,
      ...stats,
    });

    console.log(`  Campaign "${campaign.name}": ${audienceSize} communications`);
  }
}

function getRandomFinalStatus(channel: string): string {
  const rates: Record<string, Record<string, number>> = {
    whatsapp: { delivered: 0.20, read: 0.35, clicked: 0.35, failed: 0.05, sent: 0.05 },
    sms: { delivered: 0.30, read: 0.25, clicked: 0.10, failed: 0.08, sent: 0.27 },
    email: { delivered: 0.40, read: 0.15, clicked: 0.08, failed: 0.12, sent: 0.25 },
    rcs: { delivered: 0.25, read: 0.20, clicked: 0.15, failed: 0.20, sent: 0.20 },
  };
  const channelRates = rates[channel] || rates.whatsapp;
  return weightedRandom(
    Object.entries(channelRates).map(([status, weight]) => ({ value: status, weight }))
  );
}

function calculateCampaignStats(communications: any[]) {
  const counts = { sent: 0, delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0, undelivered: 0 };
  for (const comm of communications) {
    const status = comm.current_status;
    counts.sent++;
    if (status === 'delivered' || status === 'read' || status === 'clicked') counts.delivered++;
    if (status === 'read' || status === 'clicked') { counts.opened++; counts.read++; }
    if (status === 'clicked') counts.clicked++;
    if (status === 'failed') counts.failed++;
  }
  return {
    total_sent: counts.sent,
    total_delivered: counts.delivered,
    total_failed: counts.failed,
    total_opened: counts.opened,
    total_read: counts.read,
    total_clicked: counts.clicked,
    total_undelivered: counts.undelivered,
    delivery_rate: counts.sent > 0 ? Math.round((counts.delivered / counts.sent) * 10000) / 100 : 0,
    open_rate: counts.delivered > 0 ? Math.round((counts.opened / counts.delivered) * 10000) / 100 : 0,
    click_rate: counts.read > 0 ? Math.round((counts.clicked / counts.read) * 10000) / 100 : 0,
  };
}

async function seedSegments() {
  console.log('Seeding default segments...');

  const segments = [
    {
      name: 'High-Value Customers',
      description: 'Customers with total spend above ₹5,000',
      filter_config: JSON.stringify({ conditions: [{ field: 'total_spent', operator: 'gt', value: 5000 }], logic: 'AND' }),
      natural_language_query: 'Customers who have spent more than 5000 rupees total',
      customer_count: 0,
    },
    {
      name: 'Churning Customers',
      description: 'Customers inactive for 30+ days who were previously active',
      filter_config: JSON.stringify({ conditions: [{ field: 'last_purchase_at', operator: 'lt', value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }, { field: 'total_orders', operator: 'gte', value: 3 }], logic: 'AND' }),
      natural_language_query: 'Customers who have not ordered in the last 30 days but have at least 3 orders',
      customer_count: 0,
    },
    {
      name: 'Gold & Platinum Loyalists',
      description: 'Top-tier loyalty members',
      filter_config: JSON.stringify({ conditions: [{ field: 'loyalty_tier', operator: 'in', value: ['gold', 'platinum'] }], logic: 'AND' }),
      natural_language_query: 'Gold and platinum tier customers',
      customer_count: 0,
    },
    {
      name: 'WhatsApp-Preferred Active',
      description: 'Active customers who prefer WhatsApp communication',
      filter_config: JSON.stringify({ conditions: [{ field: 'preferred_channel', operator: 'eq', value: 'whatsapp' }, { field: 'engagement_score', operator: 'gte', value: 0.6 }], logic: 'AND' }),
      natural_language_query: 'Active customers who prefer WhatsApp',
      customer_count: 0,
    },
  ];

  const { error } = await supabase.from('segments').insert(segments);
  if (error) console.error('Error seeding segments:', error.message);
  else console.log(`  ${segments.length} segments created.`);
}

async function main() {
  console.log('=== ReachAI Seed Script ===');
  console.log(`Target: ${CUSTOMER_COUNT} customers, ~${CUSTOMER_COUNT * ORDERS_PER_CUSTOMER_AVG} orders\n`);

  const startTime = Date.now();

  try {
    // Clear existing data (idempotent)
    console.log('Clearing existing data...');
    await supabase.from('communication_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('campaign_stats').delete().neq('campaign_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('communications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('segments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('  Cleared.\n');

    const customers = await seedCustomers();
    await seedSegments();
    await seedCampaigns(customers);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n=== Seeding complete in ${elapsed}s ===`);
    console.log(`  Customers: ${CUSTOMER_COUNT}`);
    console.log(`  Orders: ~${CUSTOMER_COUNT * ORDERS_PER_CUSTOMER_AVG}`);
    console.log(`  Campaigns: 5`);
    console.log(`  Segments: 4`);
  } catch (err) {
    console.error('\nSeed failed:', err);
    process.exit(1);
  }
}

main();
