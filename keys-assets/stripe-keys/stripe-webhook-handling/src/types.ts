import Stripe from 'stripe';
import type { WebhookHandler, IdempotencyStore } from './handlers/webhook.js';

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: Stripe.Event.Data.Object;
  };
  created: number;
  livemode: boolean;
}

export interface WebhookHandlerConfig {
  handlers: Record<string, WebhookHandler>;
  idempotencyStore?: IdempotencyStore;
  allowedEvents?: string[];
  maxRetries?: number;
  onError?: (event: Stripe.Event, error: Error) => Promise<void> | void;
}
