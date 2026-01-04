import Stripe from 'stripe';
import type { PlanOptions } from '../types.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: (process.env.STRIPE_API_VERSION as any) || '2024-11-20.acacia',
});

/**
 * Create a new plan (price) with optional product
 */
export async function createPlan(options: PlanOptions): Promise<Stripe.Price> {
  let productId = options.productId;

  // Create product if not provided
  if (!productId && options.productName) {
    const product = await stripe.products.create({
      name: options.productName,
      description: options.productDescription,
      metadata: options.metadata || {},
    });
    productId = product.id;
  }

  if (!productId) {
    throw new Error('Either productId or productName must be provided');
  }

  const priceData: Stripe.PriceCreateParams = {
    unit_amount: options.amount,
    currency: options.currency,
    recurring: {
      interval: options.interval,
    },
    product: productId,
    metadata: options.metadata || {},
  };

  const price = await stripe.prices.create(priceData);
  return price;
}

/**
 * Update a plan (price) - note: Stripe prices are immutable, this updates metadata
 */
export async function updatePlan(
  priceId: string,
  metadata?: Record<string, string>
): Promise<Stripe.Price> {
  const updateData: Stripe.PriceUpdateParams = {};

  if (metadata) {
    updateData.metadata = metadata;
  }

  return await stripe.prices.update(priceId, updateData);
}

/**
 * Get a plan (price) by ID
 */
export async function getPlan(priceId: string): Promise<Stripe.Price> {
  return await stripe.prices.retrieve(priceId);
}

/**
 * List plans (prices) with optional filters
 */
export async function listPlans(options?: {
  productId?: string;
  active?: boolean;
  limit?: number;
  startingAfter?: string;
}): Promise<Stripe.ApiList<Stripe.Price>> {
  const params: Stripe.PriceListParams = {
    limit: options?.limit || 10,
  };

  if (options?.productId) {
    params.product = options.productId;
  }

  if (options?.active !== undefined) {
    params.active = options.active;
  }

  if (options?.startingAfter) {
    params.starting_after = options.startingAfter;
  }

  return await stripe.prices.list(params);
}

/**
 * Archive a plan (price) by archiving its product
 */
export async function archivePlan(priceId: string): Promise<Stripe.Price> {
  const price = await getPlan(priceId);
  
  if (typeof price.product === 'string') {
    await stripe.products.update(price.product, { active: false });
  } else if (price.product) {
    await stripe.products.update(price.product.id, { active: false });
  }

  return price;
}
