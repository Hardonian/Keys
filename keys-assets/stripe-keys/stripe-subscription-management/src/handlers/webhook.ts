import Stripe from 'stripe';
import type { WebhookEvent, IdempotencyStore } from '../types.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: (process.env.STRIPE_API_VERSION as any) || '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required for webhook verification');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    return event;
  } catch (err: any) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}

/**
 * In-memory idempotency store (for demonstration)
 * In production, use Redis or database
 */
class MemoryIdempotencyStore implements IdempotencyStore {
  private store: Map<string, { value: string; expiresAt: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}

// Default in-memory store (replace with Redis/database in production)
let idempotencyStore: IdempotencyStore = new MemoryIdempotencyStore();

/**
 * Set custom idempotency store
 */
export function setIdempotencyStore(store: IdempotencyStore): void {
  idempotencyStore = store;
}

/**
 * Handle webhook event with idempotency
 */
export async function handleWebhook(
  payload: string | Buffer,
  signature: string,
  handlers: {
    [eventType: string]: (event: Stripe.Event) => Promise<void> | void;
  }
): Promise<{ processed: boolean; eventId: string }> {
  // Verify signature
  const event = verifyWebhookSignature(payload, signature);

  // Check idempotency
  const idempotencyKey = `webhook:${event.id}`;
  const existingResult = await idempotencyStore.get(idempotencyKey);

  if (existingResult) {
    // Already processed
    return {
      processed: false,
      eventId: event.id,
    };
  }

  // Process event
  const handler = handlers[event.type];
  if (!handler) {
    // Event type not handled - still mark as processed to avoid reprocessing
    await idempotencyStore.set(idempotencyKey, 'unhandled', 24 * 60 * 60); // 24 hours
    return {
      processed: false,
      eventId: event.id,
    };
  }

  try {
    await handler(event);
    // Mark as processed (24 hour TTL)
    await idempotencyStore.set(idempotencyKey, 'processed', 24 * 60 * 60);
    return {
      processed: true,
      eventId: event.id,
    };
  } catch (error) {
    // Don't mark as processed on error - allow retry
    throw error;
  }
}

/**
 * Express.js middleware for webhook handling
 */
export function webhookMiddleware(handlers: {
  [eventType: string]: (event: Stripe.Event) => Promise<void> | void;
}) {
  return async (req: any, res: any, next: any) => {
    try {
      const signature = req.headers['stripe-signature'];
      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }

      const result = await handleWebhook(req.body, signature, handlers);

      if (result.processed) {
        res.json({ received: true, eventId: result.eventId });
      } else {
        res.status(200).json({ received: true, eventId: result.eventId, alreadyProcessed: true });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
