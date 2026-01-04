import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Create or sync Stripe product for a key
 */
export async function syncKeyStripeProduct(keyId: string): Promise<{
  productId: string;
  priceId: string;
}> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Get key from database
  const { data: key, error } = await supabase
    .from('marketplace_keys')
    .select('id, slug, title, description, price_cents, stripe_product_id, stripe_price_id')
    .eq('id', keyId)
    .single();

  if (error || !key) {
    throw new Error(`Key not found: ${keyId}`);
  }

  // If already synced, return existing IDs
  if (key.stripe_product_id && key.stripe_price_id) {
    return {
      productId: key.stripe_product_id,
      priceId: key.stripe_price_id,
    };
  }

  // Create Stripe product
  const product = await stripe.products.create({
    name: key.title,
    description: key.description || undefined,
    metadata: {
      key_id: key.id,
      key_slug: key.slug,
      key_type: 'marketplace_key',
    },
  });

  // Create Stripe price (one-time payment)
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: key.price_cents || 0, // Free if null
    currency: 'usd',
    metadata: {
      key_id: key.id,
      key_slug: key.slug,
    },
  });

  // Update key with Stripe IDs
  await supabase
    .from('marketplace_keys')
    .update({
      stripe_product_id: product.id,
      stripe_price_id: price.id,
    })
    .eq('id', keyId);

  return {
    productId: product.id,
    priceId: price.id,
  };
}

/**
 * Create or sync Stripe product for a bundle
 */
export async function syncBundleStripeProduct(bundleId: string): Promise<{
  productId: string;
  priceId: string;
}> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Get bundle from database
  const { data: bundle, error } = await supabase
    .from('marketplace_bundles')
    .select('id, slug, title, description, price_cents, stripe_product_id, stripe_price_id')
    .eq('id', bundleId)
    .single();

  if (error || !bundle) {
    throw new Error(`Bundle not found: ${bundleId}`);
  }

  // If already synced, return existing IDs
  if (bundle.stripe_product_id && bundle.stripe_price_id) {
    return {
      productId: bundle.stripe_product_id,
      priceId: bundle.stripe_price_id,
    };
  }

  // Create Stripe product
  const product = await stripe.products.create({
    name: bundle.title,
    description: bundle.description || undefined,
    metadata: {
      bundle_id: bundle.id,
      bundle_slug: bundle.slug,
      bundle_type: 'marketplace_bundle',
    },
  });

  // Create Stripe price (one-time payment)
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: bundle.price_cents,
    currency: 'usd',
    metadata: {
      bundle_id: bundle.id,
      bundle_slug: bundle.slug,
    },
  });

  // Update bundle with Stripe IDs
  await supabase
    .from('marketplace_bundles')
    .update({
      stripe_product_id: product.id,
      stripe_price_id: price.id,
    })
    .eq('id', bundleId);

  return {
    productId: product.id,
    priceId: price.id,
  };
}

/**
 * Create Stripe checkout session for a key
 */
export async function createKeyCheckoutSession(
  userId: string,
  keySlug: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Get key
  const { data: key } = await supabase
    .from('marketplace_keys')
    .select('id, slug, stripe_price_id, price_cents')
    .eq('slug', keySlug)
    .single();

  if (!key) {
    throw new Error(`Key not found: ${keySlug}`);
  }

  // Sync Stripe product if needed
  if (!key.stripe_price_id) {
    await syncKeyStripeProduct(key.id);
    // Re-fetch to get price ID
    const { data: updatedKey } = await supabase
      .from('marketplace_keys')
      .select('stripe_price_id')
      .eq('id', key.id)
      .single();
    key.stripe_price_id = updatedKey?.stripe_price_id;
  }

  if (!key.stripe_price_id) {
    throw new Error('Key has no Stripe price configured');
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment', // One-time payment
    payment_method_types: ['card'],
    line_items: [
      {
        price: key.stripe_price_id,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      userId,
      keyId: key.id,
      keySlug: key.slug,
      purchaseType: 'key',
    },
  });

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

/**
 * Create Stripe checkout session for a bundle
 */
export async function createBundleCheckoutSession(
  userId: string,
  bundleSlug: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Get bundle
  const { data: bundle } = await supabase
    .from('marketplace_bundles')
    .select('id, slug, stripe_price_id')
    .eq('slug', bundleSlug)
    .single();

  if (!bundle) {
    throw new Error(`Bundle not found: ${bundleSlug}`);
  }

  // Sync Stripe product if needed
  if (!bundle.stripe_price_id) {
    await syncBundleStripeProduct(bundle.id);
    // Re-fetch to get price ID
    const { data: updatedBundle } = await supabase
      .from('marketplace_bundles')
      .select('stripe_price_id')
      .eq('id', bundle.id)
      .single();
    bundle.stripe_price_id = updatedBundle?.stripe_price_id;
  }

  if (!bundle.stripe_price_id) {
    throw new Error('Bundle has no Stripe price configured');
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment', // One-time payment
    payment_method_types: ['card'],
    line_items: [
      {
        price: bundle.stripe_price_id,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      userId,
      bundleId: bundle.id,
      bundleSlug: bundle.slug,
      purchaseType: 'bundle',
    },
  });

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

/**
 * Calculate bundle discount based on owned keys
 */
export async function calculateBundleDiscount(
  userId: string,
  bundleId: string
): Promise<{
  originalPrice: number;
  discount: number;
  finalPrice: number;
  ownedKeys: string[];
}> {
  const { resolveTenantContext, getTenantEntitlements } = await import('./entitlements.js');
  const tenant = await resolveTenantContext(userId);
  const entitlements = await getTenantEntitlements(tenant.tenantId, tenant.tenantType);
  const ownedKeySlugs = entitlements.map(e => e.packSlug);

  // Get bundle
  const { data: bundle } = await supabase
    .from('marketplace_bundles')
    .select('id, price_cents, key_ids')
    .eq('id', bundleId)
    .single();

  if (!bundle) {
    throw new Error(`Bundle not found: ${bundleId}`);
  }

  const bundleKeyIds = bundle.key_ids as string[];
  const originalPrice = bundle.price_cents;

  // Get prices for keys in bundle
  const { data: keys } = await supabase
    .from('marketplace_keys')
    .select('id, slug, price_cents')
    .in('id', bundleKeyIds);

  // Calculate discount for owned keys
  let discount = 0;
  const ownedKeys: string[] = [];

  for (const key of keys || []) {
    if (ownedKeySlugs.includes(key.slug)) {
      ownedKeys.push(key.slug);
      discount += key.price_cents || 0;
    }
  }

  const finalPrice = Math.max(0, originalPrice - discount);

  return {
    originalPrice,
    discount,
    finalPrice,
    ownedKeys,
  };
}
