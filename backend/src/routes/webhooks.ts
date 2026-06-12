import { Router } from 'express';
import { supabase } from '../db/supabase.js';

const router = Router();

// Idempotency store (in production, use Redis)
const processedKeys = new Set<string>();

router.post('/delivery', async (req, res, next) => {
  try {
    const { communication_id, event_type, occurred_at, idempotency_key, metadata } = req.body;

    // Validate required fields
    if (!communication_id || !event_type || !idempotency_key) {
      return res.status(400).json({ error: 'Missing required fields: communication_id, event_type, idempotency_key' });
    }

    // Validate webhook secret
    const secret = req.headers['x-webhook-secret'];
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    // Return 202 immediately (queue-first pattern)
    res.status(202).json({ accepted: true, idempotency_key });

    // Process asynchronously — errors here are logged but don't affect response
    processDeliveryReceipt({ communication_id, event_type, occurred_at, idempotency_key, metadata })
      .catch(err => console.error('[Webhook Async Error]', err));
  } catch (err) {
    next(err);
  }
});

async function processDeliveryReceipt(payload: {
  communication_id: string;
  event_type: string;
  occurred_at: string;
  idempotency_key: string;
  metadata?: Record<string, unknown>;
}) {
  const { communication_id, event_type, occurred_at, idempotency_key, metadata } = payload;

  // Idempotency check
  if (processedKeys.has(idempotency_key)) {
    return;
  }

  // Verify communication exists
  const { data: comm } = await supabase
    .from('communications')
    .select('id, current_status')
    .eq('id', communication_id)
    .single();

  if (!comm) {
    console.warn(`[Webhook] Communication not found: ${communication_id}`);
    return;
  }

  // Validate status transition ordering
  if (!isValidTransition(comm.current_status, event_type)) {
    console.warn(`[Webhook] Invalid transition: ${comm.current_status} -> ${event_type} for ${communication_id}`);
    return;
  }

  // Insert into event log (triggers will handle status + stats updates)
  const { error } = await supabase
    .from('communication_events')
    .insert({
      communication_id,
      event_type,
      occurred_at: occurred_at || new Date().toISOString(),
      metadata: metadata || {},
      raw_payload: payload,
      idempotency_key,
    });

  if (error) {
    if (error.code === '23505') {
      // Duplicate idempotency key — safe to ignore
      return;
    }
    console.error(`[Webhook] Error processing ${idempotency_key}:`, error.message);
    return;
  }

  // Mark as processed
  processedKeys.add(idempotency_key);

  // Prevent memory leak — cap at 100K entries
  if (processedKeys.size > 100000) {
    const entries = Array.from(processedKeys);
    for (let i = 0; i < 50000; i++) {
      processedKeys.delete(entries[i]);
    }
  }
}

const STATUS_ORDER: Record<string, number> = {
  queued: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
  read: 4,
  clicked: 5,
  failed: 1,
  undelivered: 1,
};

function isValidTransition(currentStatus: string, newEvent: string): boolean {
  // Failed and undelivered can happen from any state
  if (newEvent === 'failed' || newEvent === 'undelivered') return true;

  const currentOrder = STATUS_ORDER[currentStatus] ?? 0;
  const newOrder = STATUS_ORDER[newEvent] ?? 0;

  // New event must be same or higher order
  return newOrder >= currentOrder;
}

export default router;
