/**
 * Webhook signature verification
 */

import Stripe from 'stripe';

/**
 * Verify Stripe webhook signature
 * 
 * @param signature - Stripe signature from request headers
 * @param body - Raw request body as string
 * @param webhookSecret - Stripe webhook secret from environment
 * @returns Verified Stripe event or null if verification fails
 */
export function verifyStripeWebhook(
  signature: string | null,
  body: string,
  webhookSecret: string
): Stripe.Event | null {
  if (!signature) {
    return null;
  }

  if (!webhookSecret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is required. ' +
      'Please set it in your environment variables.'
    );
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: (process.env.STRIPE_API_VERSION as any) || '2023-10-16',
    });

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    return event;
  } catch (error) {
    // Fail closed: invalid signature
    console.error('Webhook verification failed:', error);
    return null;
  }
}
