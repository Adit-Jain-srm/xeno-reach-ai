import type { SendMessageRequest } from '../../../shared/types.js';

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3002';
const BATCH_SIZE = 50;
const RATE_LIMIT_PER_SECOND = 100;

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

export function enqueueMessages(messages: QueuedMessage[]) {
  sendQueue.push(...messages);
  if (!isProcessing) {
    processQueue();
  }
}

async function processQueue() {
  if (isProcessing || sendQueue.length === 0) return;
  isProcessing = true;

  while (sendQueue.length > 0) {
    const batch = sendQueue.splice(0, BATCH_SIZE);

    const promises = batch.map(msg => sendToChannelService(msg));
    const results = await Promise.allSettled(promises);

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`[Queue] ${failed.length}/${batch.length} messages failed to send to channel service`);
    }

    // Rate limiting: pause between batches
    if (sendQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, (BATCH_SIZE / RATE_LIMIT_PER_SECOND) * 1000));
    }
  }

  isProcessing = false;
}

async function sendToChannelService(msg: QueuedMessage): Promise<void> {
  const payload: SendMessageRequest = {
    communication_id: msg.communication_id,
    campaign_id: msg.campaign_id,
    recipient: msg.recipient,
    channel: msg.channel as any,
    message: msg.message,
  };

  const response = await fetch(`${CHANNEL_SERVICE_URL}/api/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok && response.status !== 202) {
    throw new Error(`Channel service returned ${response.status}`);
  }
}

export function getQueueStats() {
  return {
    pending: sendQueue.length,
    is_processing: isProcessing,
  };
}
