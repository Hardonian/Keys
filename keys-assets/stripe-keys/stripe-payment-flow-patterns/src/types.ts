import Stripe from 'stripe';

/**
 * Options for creating a payment intent
 */
export interface PaymentIntentOptions {
  amount: number; // Amount in cents
  currency: string;
  customerId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  description?: string;
  confirm?: boolean; // Auto-confirm payment intent
  returnUrl?: string; // For redirect-based payment methods
}

/**
 * Result of payment intent creation
 */
export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntent: Stripe.PaymentIntent;
}

/**
 * Webhook event wrapper
 */
export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: Stripe.PaymentIntent | Stripe.Charge;
  };
  created: number;
  livemode: boolean;
}
