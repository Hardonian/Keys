import Stripe from 'stripe';
import type { WebhookEvent, WebhookHandlerConfig } from '../types.js';
import { IdempotencyStore, MemoryIdempotencyStore } from './idempotency.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: (process.env.STRIPE_API_VERSION as any) || '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is required');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret!
    );
    return event;
  } catch (err: any) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}

/**
 * Webhook handler function type
 */
export type WebhookHandler = (event: Stripe.Event) => Promise<void> | void;

/**
 * Create a webhook handler with idempotency and error handling
 */
export function createWebhookHandler(
  config: WebhookHandlerConfig
): (payload: string | Buffer, signature: string) => Promise<{ processed: boolean; eventId: string }> {
  const idempotencyStore = config.idempotencyStore || new MemoryIdempotencyStore();
  const handlers = config.handlers || {};
  const allowedEvents = config.allowedEvents || [];

  return async (payload: string | Buffer, signature: string) => {
    // Verify signature
    const event = verifyWebhookSignature(payload, signature);

    // Check if event type is allowed
    if (allowedEvents.length > 0 && !allowedEvents.includes(event.type)) {
      return {
        processed: false,
        eventId: event.id,
      };
    }

    // Check idempotency
    const idempotencyKey = `webhook:${event.id}`;
    const existingResult = await idempotencyStore.get(idempotencyKey);

    if (existingResult === 'processed') {
      return {
        processed: false,
        eventId: event.id,
      };
    }

    // Get handler for event type
    const handler = handlers[event.type];
    if (!handler) {
      // Mark as processed even if no handler (to avoid reprocessing)
      await idempotencyStore.set(idempotencyKey, 'unhandled', 24 * 60 * 60);
      return {
        processed: false,
        eventId: event.id,
      };
    }

    // Process event with retry logic
    let attempts = 0;
    const maxRetries = config.maxRetries || 3;

    while (attempts < maxRetries) {
      try {
        await handler(event);
        // Mark as processed
        await idempotencyStore.set(idempotencyKey, 'processed', 24 * 60 * 60);
        return {
          processed: true,
          eventId: event.id,
        };
      } catch (error: any) {
        attempts++;
        if (attempts >= maxRetries) {
          // Log error but don't mark as processed (allow retry)
          if (config.onError) {
            await config.onError(event, error);
          }
          throw error;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }

    throw new Error('Max retries exceeded');
  };
}

/**
 * Handle webhook event (simplified version)
 */
export async function handleWebhookEvent(
  payload: string | Buffer,
  signature: string,
  handlers: Record<string, WebhookHandler>
): Promise<{ processed: boolean; eventId: string }> {
  const handler = createWebhookHandler({ handlers });
  return await handler(payload, signature);
}
