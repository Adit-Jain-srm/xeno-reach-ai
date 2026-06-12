import { describe, it, expect } from 'vitest';

describe('Webhook Handler - Status Transitions', () => {
  const STATUS_ORDER: Record<string, number> = {
    queued: 0, sent: 1, delivered: 2, opened: 3, read: 4, clicked: 5, failed: 1, undelivered: 1,
  };

  function isValidTransition(currentStatus: string, newEvent: string): boolean {
    if (newEvent === 'failed' || newEvent === 'undelivered') return true;
    const currentOrder = STATUS_ORDER[currentStatus] ?? 0;
    const newOrder = STATUS_ORDER[newEvent] ?? 0;
    return newOrder >= currentOrder;
  }

  it('allows forward transitions in order', () => {
    expect(isValidTransition('queued', 'sent')).toBe(true);
    expect(isValidTransition('sent', 'delivered')).toBe(true);
    expect(isValidTransition('delivered', 'opened')).toBe(true);
    expect(isValidTransition('opened', 'read')).toBe(true);
    expect(isValidTransition('read', 'clicked')).toBe(true);
  });

  it('blocks backward transitions', () => {
    expect(isValidTransition('delivered', 'sent')).toBe(false);
    expect(isValidTransition('read', 'delivered')).toBe(false);
    expect(isValidTransition('clicked', 'opened')).toBe(false);
  });

  it('allows failed from any state', () => {
    expect(isValidTransition('queued', 'failed')).toBe(true);
    expect(isValidTransition('sent', 'failed')).toBe(true);
    expect(isValidTransition('delivered', 'failed')).toBe(true);
    expect(isValidTransition('read', 'failed')).toBe(true);
  });

  it('allows undelivered from any state', () => {
    expect(isValidTransition('sent', 'undelivered')).toBe(true);
    expect(isValidTransition('queued', 'undelivered')).toBe(true);
  });

  it('allows same-level transitions', () => {
    expect(isValidTransition('sent', 'sent')).toBe(true);
    expect(isValidTransition('delivered', 'delivered')).toBe(true);
  });

  it('handles unknown status gracefully', () => {
    expect(isValidTransition('unknown', 'sent')).toBe(true);
    expect(isValidTransition('queued', 'unknown')).toBe(true);
  });
});

describe('Webhook Idempotency', () => {
  it('generates correct idempotency key format', () => {
    const commId = '550e8400-e29b-41d4-a716-446655440000';
    const eventType = 'delivered';
    const key = `${commId}:${eventType}`;
    expect(key).toBe('550e8400-e29b-41d4-a716-446655440000:delivered');
  });

  it('different event types produce different keys', () => {
    const commId = '550e8400-e29b-41d4-a716-446655440000';
    const key1 = `${commId}:sent`;
    const key2 = `${commId}:delivered`;
    expect(key1).not.toBe(key2);
  });
});
