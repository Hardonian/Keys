import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { resolveTenantContext, getTenantEntitlements, grantEntitlement } from './entitlements.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

/**
 * Calculate upgrade cost from individual KEY to bundle
 */
export async function calculateKeyToBundleUpgrade(
  userId: string,
  bundleId: string
): Promise<{
  originalBundlePrice: number;
  ownedKeyCredits: number;
  finalPrice: number;
  ownedKeys: string[];
  upgradeCost: number;
}> {
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
  const originalBundlePrice = bundle.price_cents;

  // Get prices for keys in bundle
  const { data: keys } = await supabase
    .from('marketplace_keys')
    .select('id, slug, price_cents')
    .in('id', bundleKeyIds);

  // Calculate credits for owned keys
  let ownedKeyCredits = 0;
  const ownedKeys: string[] = [];

  for (const key of keys || []) {
    if (ownedKeySlugs.includes(key.slug)) {
      ownedKeys.push(key.slug);
      ownedKeyCredits += key.price_cents || 0;
    }
  }

  // Final price is bundle price minus credits, but never less than 0
  const finalPrice = Math.max(0, originalBundlePrice - ownedKeyCredits);
  const upgradeCost = finalPrice; // Same as final price for upgrade

  return {
    originalBundlePrice,
    ownedKeyCredits,
    finalPrice,
    ownedKeys,
    upgradeCost,
  };
}

/**
 * Calculate upgrade cost from bundle to subscription
 */
export async function calculateBundleToSubscriptionUpgrade(
  userId: string,
  subscriptionPriceId: string
): Promise<{
  subscriptionPrice: number;
  ownedBundleCredits: number;
  finalPrice: number;
  ownedBundles: string[];
  upgradeCost: number;
}> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Get subscription price
  const price = await stripe.prices.retrieve(subscriptionPriceId);
  const subscriptionPrice = price.unit_amount || 0;

  // Get user's bundle entitlements
  const tenant = await resolveTenantContext(userId);
  const { data: bundleEntitlements } = await supabase
    .from('marketplace_bundle_entitlements')
    .select('bundle_id, marketplace_bundles!inner(price_cents)')
    .eq('tenant_id', tenant.tenantId)
    .eq('tenant_type', tenant.tenantType)
    .eq('status', 'active');

  // Calculate credits from owned bundles
  let ownedBundleCredits = 0;
  const ownedBundles: string[] = [];

  if (bundleEntitlements) {
    for (const entitlement of bundleEntitlements) {
      const bundle = entitlement.marketplace_bundles as any;
      ownedBundleCredits += bundle.price_cents || 0;
      ownedBundles.push(entitlement.bundle_id);
    }
  }

  // Credit up to 50% of subscription price (prevents abuse)
  const maxCredit = subscriptionPrice * 0.5;
  const appliedCredit = Math.min(ownedBundleCredits, maxCredit);
  const finalPrice = Math.max(0, subscriptionPrice - appliedCredit);
  const upgradeCost = finalPrice;

  return {
    subscriptionPrice,
    ownedBundleCredits,
    finalPrice,
    ownedBundles,
    upgradeCost,
  };
}

/**
 * Create upgrade checkout session (individual KEY → bundle)
 */
export async function createKeyToBundleUpgradeSession(
  userId: string,
  bundleId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const upgrade = await calculateKeyToBundleUpgrade(userId, bundleId);

  if (upgrade.finalPrice === 0) {
    // User already owns all keys, grant bundle entitlements for free
    const tenant = await resolveTenantContext(userId);
    const { data: bundle } = await supabase
      .from('marketplace_bundles')
      .select('key_ids')
      .eq('id', bundleId)
      .single();

    if (bundle) {
      const keyIds = bundle.key_ids as string[];
      for (const keyId of keyIds) {
        await grantEntitlement(tenant.tenantId, tenant.tenantType, keyId, 'stripe');
      }
    }

    return {
      sessionId: 'free-upgrade',
      url: successUrl,
    };
  }

  // Get bundle Stripe price ID
  const { data: bundle } = await supabase
    .from('marketplace_bundles')
    .select('stripe_price_id')
    .eq('id', bundleId)
    .single();

  if (!bundle || !bundle.stripe_price_id) {
    throw new Error('Bundle has no Stripe price configured');
  }

  // Create checkout session with upgrade metadata
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
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
      bundleId,
      purchaseType: 'bundle',
      upgradeType: 'key_to_bundle',
      ownedKeyCredits: upgrade.ownedKeyCredits.toString(),
    },
    // Apply discount via Stripe coupon or adjust price
    // Note: For exact credit application, may need to create custom price
  });

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

/**
 * Create upgrade checkout session (bundle → subscription)
 */
export async function createBundleToSubscriptionUpgradeSession(
  userId: string,
  subscriptionPriceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const upgrade = await calculateBundleToSubscriptionUpgrade(userId, subscriptionPriceId);

  if (upgrade.finalPrice === 0) {
    // User already has enough bundle credits, activate subscription for free
    // This is unlikely but handle gracefully
    return {
      sessionId: 'free-upgrade',
      url: successUrl,
    };
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: subscriptionPriceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      userId,
      purchaseType: 'subscription',
      upgradeType: 'bundle_to_subscription',
      ownedBundleCredits: upgrade.ownedBundleCredits.toString(),
    },
    // Apply discount via Stripe coupon
    // Note: For exact credit application, may need to create custom price
  });

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

/**
 * Process upgrade after successful payment
 * Called from webhook handler
 */
export async function processUpgrade(
  sessionId: string,
  userId: string,
  upgradeType: 'key_to_bundle' | 'bundle_to_subscription'
): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const tenant = await resolveTenantContext(userId);

  if (upgradeType === 'key_to_bundle') {
    const bundleId = session.metadata?.bundleId;
    if (bundleId) {
      // Grant bundle entitlements (webhook handler already does this)
      // This function is for additional upgrade-specific logic if needed
      logger.info(`Upgrade processed: key_to_bundle for user ${userId}, bundle ${bundleId}`);
    }
  } else if (upgradeType === 'bundle_to_subscription') {
    // Subscription activation handled by webhook
    logger.info(`Upgrade processed: bundle_to_subscription for user ${userId}`);
  }
}
