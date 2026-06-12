import type { SendMessageRequest } from '../../../shared/types.js';
import { config } from 'dotenv';

config();

const BATCH_SIZE = 50;
const RATE_LIMIT_DELAY_MS = 500;

interface QueuedMessage {
  communication_id: string;
  campaign_id: string;
  recipient: {
    customer_id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  channel: string;
  message: {
    content: string;
    personalization?: Record<string, string>;
  };
}

let sendQueue: QueuedMessage[] = [];
let isProcessing = false;
let totalSent = 0;
let totalFailed = 0;

export function enqueueMessages(messages: QueuedMessage[]) {
  sendQueue.push(...messages);
  console.log(`[Queue] Enqueued ${messages.length} messages. Total pending: ${sendQueue.length}`);
  if (!isProcessing) {
    processQueue();
  }
}

async function processQueue() {
  if (isProcessing || sendQueue.length === 0) return;
  isProcessing = true;

  try {
    while (sendQueue.length > 0) {
      const batch = sendQueue.splice(0, BATCH_SIZE);

      const promises = batch.map(msg => sendToChannelService(msg));
      const results = await Promise.allSettled(promises);

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      totalSent += succeeded;
      totalFailed += failed;

      if (failed > 0) {
        console.warn(`[Queue] Batch: ${succeeded} sent, ${failed} failed. Remaining: ${sendQueue.length}`);
      }

      if (sendQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
      }
    }
  } catch (err) {
    console.error('[Queue] processQueue crashed:', (err as Error).message);
  } finally {
    isProcessing = false;
    if (sendQueue.length > 0) {
      setTimeout(processQueue, 1000);
    }
  }
}

async function sendToChannelService(msg: QueuedMessage): Promise<void> {
  const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3002';

  const payload: SendMessageRequest = {
    communication_id: msg.communication_id,
    campaign_id: msg.campaign_id,
    recipient: msg.recipient,
    channel: msg.channel as any,
    message: msg.message,
  };

  const response = await fetch(`${channelServiceUrl}/api/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok && response.status !== 202) {
    throw new Error(`Channel service returned ${response.status}`);
  }
}

export function getQueueStats() {
  return {
    pending: sendQueue.length,
    is_processing: isProcessing,
    total_sent: totalSent,
    total_failed: totalFailed,
  };
}
