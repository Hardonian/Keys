import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import Stripe from 'stripe';
import { errorHandler, notFoundHandler } from '../../../src/middleware/errorHandler.js';

const stripeWebhookEvents = new Map<string, { id: string; status: string }>();
const userProfiles = new Map<string, { user_id: string }>();

vi.mock('@supabase/supabase-js', () => {
  const supabase = {
    from: (table: string) => {
      if (table === 'stripe_webhook_events') {
        return {
          select: () => ({
            eq: (_col: string, value: string) => ({
              single: async () => {
                const existing = stripeWebhookEvents.get(value);
                return { data: existing ?? null, error: null };
              },
            }),
          }),
          insert: async (payload: { stripe_event_id: string; status: string }) => {
            stripeWebhookEvents.set(payload.stripe_event_id, {
              id: payload.stripe_event_id,
              status: payload.status,
            });
            return { error: null };
          },
          update: (_payload: { status: string }) => ({
            eq: async (_col: string, value: string) => {
              const existing = stripeWebhookEvents.get(value);
              if (existing) {
                stripeWebhookEvents.set(value, { ...existing, status: 'processed' });
              }
              return { error: null };
            },
          }),
        };
      }

      if (table === 'user_profiles') {
        return {
          select: () => ({
            eq: (_col: string, value: string) => ({
              single: async () => {
                const profile = userProfiles.get(value);
                if (!profile) {
                  return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
                }
                return { data: profile, error: null };
              },
            }),
          }),
          update: (_payload: Record<string, unknown>) => ({
            eq: async (_col: string, _value: string) => ({ error: null }),
          }),
        };
      }

      return {
        select: () => ({
          eq: (_col: string, _value: string) => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
        insert: async () => ({ error: null }),
        update: () => ({
          eq: async () => ({ error: null }),
        }),
      };
    },
  };

  return { createClient: vi.fn(() => supabase) };
});

let app: express.Application;
let stripe: Stripe;
const webhookSecret = 'whsec_test_123';

describe('Billing webhook integration', () => {
  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

    const { billingWebhookRouter } = await import('../../../src/routes/billing.js');
    app = express();
    app.use('/billing/webhook', express.raw({ type: 'application/json' }), billingWebhookRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  beforeEach(() => {
    stripeWebhookEvents.clear();
    userProfiles.clear();
    userProfiles.set('cus_123', { user_id: 'user_123' });
  });

  it('rejects invalid webhook signatures', async () => {
    const payload = JSON.stringify({
      id: 'evt_invalid',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_123',
          customer: 'cus_123',
          subscription: 'sub_123',
          attempt_count: 1,
          next_payment_attempt: Math.floor(Date.now() / 1000) + 86400,
        },
      },
    });

    const response = await request(app)
      .post('/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', 'invalid-signature')
      .send(payload)
      .expect(400);

    expect(response.body).toEqual({ error: 'Invalid signature' });
  });

  it('accepts valid signatures and rejects replays', async () => {
    const payload = JSON.stringify({
      id: 'evt_replay',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_456',
          customer: 'cus_123',
          subscription: 'sub_123',
          attempt_count: 1,
          next_payment_attempt: Math.floor(Date.now() / 1000) + 86400,
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });

    const firstResponse = await request(app)
      .post('/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signature)
      .send(payload)
      .expect(200);

    expect(firstResponse.body).toEqual({ received: true });

    const replayResponse = await request(app)
      .post('/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signature)
      .send(payload)
      .expect(200);

    expect(replayResponse.body).toEqual({ received: true, duplicate: true });
  });
});
