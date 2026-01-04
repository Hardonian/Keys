import Stripe from 'stripe';
import type { SubscriptionOptions, UpdateSubscriptionOptions } from '../types.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: (process.env.STRIPE_API_VERSION as any) || '2024-11-20.acacia',
});

/**
 * Create a new subscription
 */
export async function createSubscription(options: SubscriptionOptions): Promise<Stripe.Subscription> {
  const subscriptionData: Stripe.SubscriptionCreateParams = {
    customer: options.customerId,
    items: [
      {
        price: options.priceId,
        quantity: options.quantity || 1,
      },
    ],
    metadata: options.metadata || {},
  };

  if (options.trialEnd) {
    subscriptionData.trial_end = options.trialEnd;
  }

  if (options.paymentBehavior) {
    subscriptionData.payment_behavior = options.paymentBehavior;
  }

  if (options.prorationBehavior) {
    subscriptionData.proration_behavior = options.prorationBehavior;
  }

  const subscription = await stripe.subscriptions.create(subscriptionData);
  return subscription;
}

/**
 * Update an existing subscription
 */
export async function updateSubscription(
  options: UpdateSubscriptionOptions
): Promise<Stripe.Subscription> {
  const updateData: Stripe.SubscriptionUpdateParams = {};

  if (options.priceId) {
    updateData.items = [
      {
        price: options.priceId,
        quantity: options.quantity || 1,
      },
    ];
    updateData.proration_behavior = options.prorationBehavior || 'create_prorations';
  } else if (options.quantity !== undefined) {
    // Update quantity for existing price
    const subscription = await getSubscription(options.subscriptionId);
    const itemId = subscription.items.data[0]?.id;
    if (itemId) {
      updateData.items = [
        {
          id: itemId,
          quantity: options.quantity,
        },
      ];
      updateData.proration_behavior = options.prorationBehavior || 'create_prorations';
    }
  }

  if (options.cancelAtPeriodEnd !== undefined) {
    updateData.cancel_at_period_end = options.cancelAtPeriodEnd;
  }

  if (options.metadata) {
    updateData.metadata = options.metadata;
  }

  const subscription = await stripe.subscriptions.update(
    options.subscriptionId,
    updateData
  );
  return subscription;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId);
  } else {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
}

/**
 * Get a subscription by ID
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * List subscriptions with optional filters
 */
export async function listSubscriptions(options?: {
  customerId?: string;
  status?: Stripe.Subscription.Status;
  limit?: number;
  startingAfter?: string;
}): Promise<Stripe.ApiList<Stripe.Subscription>> {
  const params: Stripe.SubscriptionListParams = {
    limit: options?.limit || 10,
  };

  if (options?.customerId) {
    params.customer = options.customerId;
  }

  if (options?.status) {
    params.status = options.status;
  }

  if (options?.startingAfter) {
    params.starting_after = options.startingAfter;
  }

  return await stripe.subscriptions.list(params);
}
