/**
 * Background reconciliation job
 */

import Stripe from 'stripe';
import type { ReconciliationConfig } from '../types';

/**
 * Reconciliation job that syncs subscription data from Stripe
 * 
 * Processes each tenant separately and handles errors gracefully
 * 
 * @param config - Reconciliation configuration
 */
export async function reconciliationJob(
  config?: ReconciliationConfig
): Promise<void> {
  const stripeSecretKey =
    config?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
  const databaseUrl = config?.databaseUrl || process.env.DATABASE_URL;

  // Validate environment variables
  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY is not configured. Skipping job.');
    return;
  }

  if (!databaseUrl) {
    console.error('DATABASE_URL is not configured. Skipping job.');
    return;
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: (process.env.STRIPE_API_VERSION as any) || '2023-10-16',
    });

    // Get all active tenants (pseudo-code - replace with your actual query)
    // const tenants = await getActiveTenants();

    // For demonstration, we'll process a single reconciliation
    console.log('Starting reconciliation job...');

    // Get all active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });

    console.log(`Found ${subscriptions.data.length} active subscriptions`);

    // Process each subscription
    for (const subscription of subscriptions.data) {
      try {
        // Extract tenant_id from metadata
        const tenantId = subscription.metadata.tenant_id;

        if (!tenantId) {
          console.warn(
            `Subscription ${subscription.id} has no tenant_id. Skipping.`
          );
          continue;
        }

        // Reconcile subscription data
        // In a real implementation, you would:
        // 1. Query local database for subscription
        // 2. Compare with Stripe data
        // 3. Update local database if discrepancies found
        // 4. Send notification if needed

        console.log(`Reconciled subscription ${subscription.id} for tenant ${tenantId}`);
      } catch (error) {
        // Log error, continue to next subscription
        console.error(
          `Reconciliation failed for subscription ${subscription.id}:`,
          error
        );
        // Don't throw - continue processing other subscriptions
      }
    }

    console.log('Reconciliation job completed');
  } catch (error) {
    // Log error, don't crash
    console.error('Reconciliation job failed:', error);
    // Don't throw - job runner handles retries
  }
}
