/**
 * Entitlement checking logic
 */

import Stripe from 'stripe';

export interface CheckEntitlementParams {
  customerId: string;
  feature: string;
  stripeSecretKey: string;
}

/**
 * Check if a Stripe customer has access to a specific feature
 * 
 * Fails closed: returns false on any uncertainty
 * 
 * @param params - Entitlement check parameters
 * @returns Entitlement result
 */
export async function checkStripeEntitlement(
  params: CheckEntitlementParams
): Promise<{ hasAccess: boolean; subscriptionId?: string; features?: string[] }> {
  const { customerId, feature, stripeSecretKey } = params;

  if (!stripeSecretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is required. ' +
      'Please set it in your environment variables.'
    );
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: (process.env.STRIPE_API_VERSION as any) || '2023-10-16',
    });

    // Get customer's active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Fail closed: no active subscription
      return { hasAccess: false };
    }

    const subscription = subscriptions.data[0];

    // Check if any subscription item has the feature
    const hasFeature = subscription.items.data.some((item) => {
      const features = item.price.metadata?.features;
      if (!features) {
        return false;
      }

      // Features can be comma-separated
      const featureList = features.split(',').map((f) => f.trim());
      return featureList.includes(feature);
    });

    // Extract all features for reference
    const allFeatures = subscription.items.data
      .flatMap((item) => {
        const features = item.price.metadata?.features;
        if (!features) {
          return [];
        }
        return features.split(',').map((f) => f.trim());
      })
      .filter((f) => f.length > 0);

    return {
      hasAccess: hasFeature,
      subscriptionId: subscription.id,
      features: allFeatures,
    };
  } catch (error) {
    // Fail closed: on error, deny access
    console.error('Entitlement check failed:', error);
    return { hasAccess: false };
  }
}
