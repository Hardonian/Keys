import Stripe from 'stripe';
import type { WebhookEvent } from '../types.js';

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
 * Handle payment webhook events
 */
export async function handlePaymentWebhook(
  payload: string | Buffer,
  signature: string,
  handlers: {
    onPaymentSucceeded?: (paymentIntent: Stripe.PaymentIntent) => Promise<void> | void;
    onPaymentFailed?: (paymentIntent: Stripe.PaymentIntent) => Promise<void> | void;
    onChargeSucceeded?: (charge: Stripe.Charge) => Promise<void> | void;
    onChargeFailed?: (charge: Stripe.Charge) => Promise<void> | void;
  }
): Promise<{ processed: boolean; eventId: string }> {
  // Verify signature
  const event = verifyWebhookSignature(payload, signature);

  // Handle event
  switch (event.type) {
    case 'payment_intent.succeeded':
      if (handlers.onPaymentSucceeded) {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlers.onPaymentSucceeded(paymentIntent);
      }
      break;

    case 'payment_intent.payment_failed':
      if (handlers.onPaymentFailed) {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlers.onPaymentFailed(paymentIntent);
      }
      break;

    case 'charge.succeeded':
      if (handlers.onChargeSucceeded) {
        const charge = event.data.object as Stripe.Charge;
        await handlers.onChargeSucceeded(charge);
      }
      break;

    case 'charge.failed':
      if (handlers.onChargeFailed) {
        const charge = event.data.object as Stripe.Charge;
        await handlers.onChargeFailed(charge);
      }
      break;

    default:
      // Event type not handled
      break;
  }

  return {
    processed: true,
    eventId: event.id,
  };
}

/**
 * Express.js middleware for payment webhooks
 */
export function webhookMiddleware(handlers: {
  onPaymentSucceeded?: (paymentIntent: Stripe.PaymentIntent) => Promise<void> | void;
  onPaymentFailed?: (paymentIntent: Stripe.PaymentIntent) => Promise<void> | void;
  onChargeSucceeded?: (charge: Stripe.Charge) => Promise<void> | void;
  onChargeFailed?: (charge: Stripe.Charge) => Promise<void> | void;
}) {
  return async (req: any, res: any, next: any) => {
    try {
      const signature = req.headers['stripe-signature'];
      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }

      const result = await handlePaymentWebhook(req.body, signature, handlers);
      res.json({ received: true, eventId: result.eventId });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
