/**
 * Unit tests for Stripe Webhook Entitlement Key
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { verifyStripeWebhook } from '../src/validators/webhook';
import { checkStripeEntitlement } from '../src/validators/entitlement';

describe('verifyStripeWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when signature is missing', () => {
    const result = verifyStripeWebhook(null, 'body', 'secret');
    expect(result).toBeNull();
  });

  it('should throw error when webhook secret is missing', () => {
    expect(() => {
      verifyStripeWebhook('signature', 'body', '');
    }).toThrow('STRIPE_WEBHOOK_SECRET is required');
  });
});

describe('checkStripeEntitlement', () => {
  it('should throw error when stripe secret key is missing', async () => {
    await expect(
      checkStripeEntitlement({
        customerId: 'cus_123',
        feature: 'premium',
        stripeSecretKey: '',
      })
    ).rejects.toThrow('STRIPE_SECRET_KEY is required');
  });

  it('should fail closed when customer has no subscription', async () => {
    // Mock Stripe API to return empty subscriptions
    const result = await checkStripeEntitlement({
      customerId: 'cus_no_subscription',
      feature: 'premium',
      stripeSecretKey: 'sk_test_123',
    });

    expect(result.hasAccess).toBe(false);
  });
});
