/**
 * Stripe webhook handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyStripeWebhook } from '../validators/webhook';
import type { StripeWebhookConfig } from '../types';

/**
 * Stripe webhook handler for subscription events
 * 
 * Handles:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * 
 * @param req - Next.js request object
 * @param config - Stripe webhook configuration
 * @returns Next.js response
 */
export async function stripeWebhookHandler(
  req: NextRequest,
  config?: StripeWebhookConfig
): Promise<NextResponse> {
  // Validate environment variables
  const stripeSecretKey =
    config?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
  const webhookSecret =
    config?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: 'STRIPE_SECRET_KEY is not configured' },
      { status: 500 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET is not configured' },
      { status: 500 }
    );
  }

  try {
    // Get signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 401 }
      );
    }

    // Get raw body
    const body = await req.text();

    // Verify webhook signature
    const stripe = await import('stripe').then((m) => m.default);
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    // Extract tenant_id from event metadata or customer
    const tenantId =
      event.data.object.metadata?.tenant_id ||
      (event.data.object as any).customer;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant_id in webhook event' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Process subscription event
        // In a real implementation, you would update your database here
        console.log(`Subscription event: ${event.type} for tenant: ${tenantId}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    // Handle signature verification errors
    if (error.type === 'StripeSignatureVerificationError') {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Log error for debugging
    console.error('Webhook processing error:', error);

    // Return graceful error
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
