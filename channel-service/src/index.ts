import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

config();

const app = express();
const PORT = parseInt(process.env.CHANNEL_PORT || process.env.PORT || '3002');

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'channel-service', timestamp: new Date().toISOString() });
});

// Stats endpoint
const stats = {
  total_received: 0,
  total_callbacks_sent: 0,
  total_callbacks_failed: 0,
  active_simulations: 0,
};

app.get('/api/stats', (_req, res) => {
  res.json(stats);
});

// Send endpoint — receives messages from CRM and simulates delivery
app.post('/api/send', async (req, res) => {
  const { communication_id, campaign_id, recipient, channel, message, metadata } = req.body;

  if (!communication_id || !channel || !message) {
    return res.status(400).json({ error: 'Missing required fields: communication_id, channel, message' });
  }

  stats.total_received++;
  stats.active_simulations++;

  // Respond immediately with 202 Accepted
  res.status(202).json({ accepted: true, communication_id });

  // Simulate async delivery lifecycle
  simulateDelivery(communication_id, channel);
});

// Channel-specific delivery parameters
const CHANNEL_CONFIG: Record<string, { deliveryRate: number; openRate: number; readRate: number; clickRate: number; deliveryDelayMs: [number, number]; openDelayMs: [number, number]; readDelayMs: [number, number]; clickDelayMs: [number, number] }> = {
  whatsapp: { deliveryRate: 0.95, openRate: 0.75, readRate: 0.60, clickRate: 0.40, deliveryDelayMs: [1000, 5000], openDelayMs: [5000, 30000], readDelayMs: [3000, 15000], clickDelayMs: [5000, 30000] },
  sms: { deliveryRate: 0.92, openRate: 0.60, readRate: 0.45, clickRate: 0.15, deliveryDelayMs: [2000, 15000], openDelayMs: [10000, 60000], readDelayMs: [5000, 30000], clickDelayMs: [15000, 60000] },
  email: { deliveryRate: 0.88, openRate: 0.35, readRate: 0.25, clickRate: 0.12, deliveryDelayMs: [5000, 30000], openDelayMs: [30000, 120000], readDelayMs: [10000, 60000], clickDelayMs: [30000, 120000] },
  rcs: { deliveryRate: 0.80, openRate: 0.50, readRate: 0.40, clickRate: 0.25, deliveryDelayMs: [2000, 10000], openDelayMs: [10000, 45000], readDelayMs: [5000, 20000], clickDelayMs: [10000, 45000] },
};

// Demo mode: much faster for live demonstrations
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const DEMO_SPEED_FACTOR = 0.1; // 10x faster in demo mode

function randomDelay(range: [number, number]): number {
  const [min, max] = range;
  const delay = min + Math.random() * (max - min);
  return DEMO_MODE ? delay * DEMO_SPEED_FACTOR : delay;
}

async function simulateDelivery(communicationId: string, channel: string) {
  const config = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.whatsapp;
  const webhookUrl = process.env.CRM_WEBHOOK_URL || 'http://localhost:3001/api/webhooks/delivery';

  try {
    // Step 1: "sent" event (immediate)
    await delay(randomDelay([500, 1500]));
    await emitCallback(webhookUrl, communicationId, 'sent');

    // Step 2: delivered or failed
    await delay(randomDelay(config.deliveryDelayMs));
    if (Math.random() <= config.deliveryRate) {
      await emitCallback(webhookUrl, communicationId, 'delivered');

      // Step 3: opened (conditional)
      if (Math.random() <= config.openRate) {
        await delay(randomDelay(config.openDelayMs));
        await emitCallback(webhookUrl, communicationId, 'opened');

        // Step 4: read (conditional)
        if (Math.random() <= config.readRate) {
          await delay(randomDelay(config.readDelayMs));
          await emitCallback(webhookUrl, communicationId, 'read');

          // Step 5: clicked (conditional)
          if (Math.random() <= config.clickRate) {
            await delay(randomDelay(config.clickDelayMs));
            await emitCallback(webhookUrl, communicationId, 'clicked');
          }
        }
      }
    } else {
      const reasons = ['recipient_unreachable', 'invalid_number', 'carrier_error', 'rate_limited', 'content_blocked'];
      await emitCallback(webhookUrl, communicationId, 'failed', {
        reason: reasons[Math.floor(Math.random() * reasons.length)],
      });
    }
  } catch (err) {
    console.error(`[Simulation Error] ${communicationId}:`, (err as Error).message);
  } finally {
    stats.active_simulations--;
  }
}

async function emitCallback(
  webhookUrl: string,
  communicationId: string,
  eventType: string,
  metadata: Record<string, unknown> = {}
) {
  const payload = {
    communication_id: communicationId,
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    idempotency_key: `${communicationId}:${eventType}`,
    metadata,
  };

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.CHANNEL_WEBHOOK_SECRET || '',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 202) {
        stats.total_callbacks_sent++;
        return;
      }

      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      // 4xx errors — don't retry
      stats.total_callbacks_failed++;
      console.warn(`[Callback 4xx] ${communicationId}:${eventType} -> ${response.status}`);
      return;
    } catch (err) {
      attempts++;
      if (attempts >= maxAttempts) {
        stats.total_callbacks_failed++;
        console.error(`[Callback Failed] ${communicationId}:${eventType} after ${maxAttempts} attempts`);
        return;
      }
      // Exponential backoff with jitter
      const backoff = Math.pow(2, attempts) * 1000 + Math.random() * 500;
      await delay(backoff);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.listen(PORT, () => {
  console.log(`[Channel Service] Running on port ${PORT}`);
  console.log(`[Channel Service] Mode: ${DEMO_MODE ? 'DEMO (fast)' : 'REALISTIC'}`);
  console.log(`[Channel Service] Webhook target: ${process.env.CRM_WEBHOOK_URL || 'http://localhost:3001/api/webhooks/delivery'}`);
});

export default app;
