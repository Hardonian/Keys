import Stripe from 'stripe';
import type { MultiProductSubscriptionOptions } from '../types.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: (process.env.STRIPE_API_VERSION as any) || '2024-11-20.acacia',
});

/**
 * Create subscription with multiple products
 */
export async function createMultiProductSubscription(
  options: MultiProductSubscriptionOptions
): Promise<Stripe.Subscription> {
  const items = options.products.map(product => ({
    price: product.priceId,
    quantity: product.quantity || 1,
  }));

  const subscription = await stripe.subscriptions.create({
    customer: options.customerId,
    items: items,
    metadata: options.metadata || {},
  });

  return subscription;
}

/**
 * Update subscription products
 */
export async function updateSubscriptionProducts(
  subscriptionId: string,
  products: Array<{ priceId: string; quantity?: number }>
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const items = products.map((product, index) => ({
    id: subscription.items.data[index]?.id,
    price: product.priceId,
    quantity: product.quantity || 1,
  }));

  return await stripe.subscriptions.update(subscriptionId, {
    items: items,
    proration_behavior: 'create_prorations',
  });
}

/**
 * Add product to existing subscription
 */
export async function addProductToSubscription(
  subscriptionId: string,
  priceId: string,
  quantity: number = 1
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    items: [{
      price: priceId,
      quantity: quantity,
    }],
    proration_behavior: 'create_prorations',
    expand: ['items'],
  });
}

/**
 * Remove product from subscription
 */
export async function removeProductFromSubscription(
  subscriptionId: string,
  itemId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: itemId,
      deleted: true,
    }],
    proration_behavior: 'create_prorations',
  });
}
