import Stripe from 'stripe';
import type { PaymentIntentOptions, PaymentIntentResult } from '../types.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: (process.env.STRIPE_API_VERSION as any) || '2024-11-20.acacia',
});

/**
 * Create a payment intent for one-time payment
 */
export async function createPaymentIntent(
  options: PaymentIntentOptions
): Promise<PaymentIntentResult> {
  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
    amount: options.amount,
    currency: options.currency,
    metadata: options.metadata || {},
  };

  if (options.customerId) {
    paymentIntentData.customer = options.customerId;
  }

  if (options.paymentMethodId) {
    paymentIntentData.payment_method = options.paymentMethodId;
  }

  if (options.description) {
    paymentIntentData.description = options.description;
  }

  if (options.confirm) {
    paymentIntentData.confirm = true;
  }

  if (options.returnUrl) {
    paymentIntentData.return_url = options.returnUrl;
  }

  // Enable automatic payment methods
  paymentIntentData.automatic_payment_methods = {
    enabled: true,
  };

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

  if (!paymentIntent.client_secret) {
    throw new Error('Payment intent created but no client secret returned');
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntent,
  };
}

/**
 * Confirm a payment intent (for server-side confirmation)
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<Stripe.PaymentIntent> {
  const confirmData: Stripe.PaymentIntentConfirmParams = {};

  if (paymentMethodId) {
    confirmData.payment_method = paymentMethodId;
  }

  return await stripe.paymentIntents.confirm(paymentIntentId, confirmData);
}

/**
 * Get a payment intent by ID
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.cancel(paymentIntentId);
}
