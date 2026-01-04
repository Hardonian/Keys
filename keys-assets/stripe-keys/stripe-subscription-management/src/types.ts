import Stripe from 'stripe';

/**
 * Options for creating a subscription
 */
export interface SubscriptionOptions {
  customerId: string;
  priceId: string;
  quantity?: number;
  trialEnd?: number; // Unix timestamp
  metadata?: Record<string, string>;
  paymentBehavior?: 'default_incomplete' | 'error_if_incomplete' | 'pending_if_incomplete';
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

/**
 * Options for updating a subscription
 */
export interface UpdateSubscriptionOptions {
  subscriptionId: string;
  priceId?: string;
  quantity?: number;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, string>;
}

/**
 * Options for creating a plan/price
 */
export interface PlanOptions {
  amount: number; // Amount in cents
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  productId?: string;
  productName?: string;
  productDescription?: string;
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
}

/**
 * Options for creating a customer
 */
export interface CustomerOptions {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
  paymentMethodId?: string;
}

/**
 * Webhook event wrapper
 */
export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: Stripe.Subscription | Stripe.Invoice | Stripe.Customer;
    previous_attributes?: Record<string, any>;
  };
  created: number;
  livemode: boolean;
}

/**
 * Idempotency key storage interface
 */
export interface IdempotencyStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
}
