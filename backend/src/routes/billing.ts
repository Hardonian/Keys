import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { z } from 'zod';
import Stripe from 'stripe';
import { logger } from '../utils/logger.js';

const router = Router();

// Initialize Stripe (will be null if key not provided)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

/**
 * Map Stripe price ID to subscription tier and guarantee coverage
 * In production, these would be environment variables or fetched from Stripe
 */
function getTierFromPriceId(priceId: string): {
  tier: 'free' | 'pro' | 'pro+' | 'enterprise';
  guaranteeCoverage: string[];
  integrationAccess: string[];
} {
  // These would be actual Stripe price IDs in production
  // For now, we'll use a mapping based on price ID patterns
  const priceIdLower = priceId.toLowerCase();
  
  if (priceIdLower.includes('pro-plus') || priceIdLower.includes('pro+')) {
    return {
      tier: 'pro+',
      guaranteeCoverage: ['security', 'compliance', 'quality'],
      integrationAccess: ['ide', 'cicd'],
    };
  } else if (priceIdLower.includes('enterprise')) {
    return {
      tier: 'enterprise',
      guaranteeCoverage: ['security', 'compliance', 'quality', 'sla'],
      integrationAccess: ['ide', 'cicd'],
    };
  } else if (priceIdLower.includes('pro')) {
    return {
      tier: 'pro',
      guaranteeCoverage: ['security', 'compliance', 'quality'],
      integrationAccess: [],
    };
  }
  
  // Default to free
  return {
    tier: 'free',
    guaranteeCoverage: [],
    integrationAccess: [],
  };
}

const createCheckoutSessionSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

/**
 * Create Stripe Checkout Session
 * POST /billing/checkout
 */
router.post(
  '/checkout',
  authMiddleware,
  validateBody(createCheckoutSessionSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!stripe) {
      return res.status(503).json({
        error: 'Billing is not configured',
      });
    }

    const userId = req.userId!;
    const { priceId, successUrl, cancelUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  })
);

/**
 * Get customer portal URL
 * GET /billing/portal
 */
router.get(
  '/portal',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!stripe) {
      return res.status(503).json({
        error: 'Billing is not configured',
      });
    }

    const userId = req.userId!;

    // Find or create Stripe customer
    // In production, you'd store customer_id in user_profiles
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create customer
      const customer = await stripe.customers.create({
        email: req.user?.email,
        metadata: { userId },
      });
      customerId = customer.id;

      // Store in profile
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }

    const returnUrl = (req.query.returnUrl as string) || process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    res.json({ url: session.url });
  })
);

/**
 * Webhook handler for Stripe events
 * POST /billing/webhook
 */
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Billing is not configured' });
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    let event: Stripe.Event;

    try {
      // req.body is a Buffer when using express.raw() middleware
      const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      logger.error('Webhook signature verification failed', err as Error, {
        requestId: req.headers['x-request-id'] as string,
        eventId: req.body?.id,
      });
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check for duplicate event (idempotency)
    const { data: existingEvent } = await supabase
      .from('stripe_webhook_events')
      .select('id, status')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingEvent) {
      // Event already processed
      return res.json({ received: true, duplicate: true });
    }

    // Record event processing start (with error handling)
    const { error: insertError } = await supabase.from('stripe_webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      status: 'processing', // Start as 'processing', update to 'processed' on success
    });

    if (insertError && !insertError.message.includes('duplicate')) {
      logger.error('Failed to record webhook event', insertError as any, {
        requestId: req.headers['x-request-id'] as string,
        eventId: event.id,
        eventType: event.type,
      });
      // Continue processing even if recording fails
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;

        if (userId) {
          // Check if this is a marketplace key or bundle purchase
          const purchaseType = session.metadata?.purchaseType;
          const keySlug = session.metadata?.keySlug;
          const keyId = session.metadata?.keyId;
          const bundleSlug = session.metadata?.bundleSlug;
          const bundleId = session.metadata?.bundleId;

          if (purchaseType === 'key' && (keySlug || keyId)) {
            // Grant marketplace key entitlement
            try {
              const { grantEntitlement, resolveTenantContext } = await import('../lib/marketplace/entitlements.js');
              const tenant = await resolveTenantContext(userId);

              // Resolve key_id if slug was provided
              let resolvedKeyId = keyId;
              if (!resolvedKeyId && keySlug) {
                const { data: key } = await supabase
                  .from('marketplace_keys')
                  .select('id')
                  .eq('slug', keySlug)
                  .single();
                if (key) {
                  resolvedKeyId = key.id;
                }
              }

              if (resolvedKeyId) {
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
                const priceId = lineItems.data[0]?.price?.id || '';

                await grantEntitlement(
                  tenant.tenantId,
                  tenant.tenantType,
                  resolvedKeyId,
                  'stripe',
                  {
                    stripePriceId: priceId || undefined,
                  }
                );

                // Track analytics
                await supabase.from('marketplace_analytics').insert({
                  event_type: 'purchase',
                  key_id: resolvedKeyId,
                  user_id: userId,
                  tenant_id: tenant.tenantId,
                  tenant_type: tenant.tenantType,
                });
              }
            } catch (error) {
              logger.error('Failed to grant marketplace key entitlement', error as Error, {
                requestId: req.headers['x-request-id'] as string,
                userId,
                keyId: resolvedKeyId,
                eventId: event.id,
              });
              // Don't fail the webhook, but log the error
            }
          } else if (purchaseType === 'bundle' && (bundleSlug || bundleId)) {
            // Grant bundle entitlements
            try {
              const { grantEntitlement, resolveTenantContext } = await import('../lib/marketplace/entitlements.js');
              const tenant = await resolveTenantContext(userId);

              // Resolve bundle_id if slug was provided
              let resolvedBundleId = bundleId;
              if (!resolvedBundleId && bundleSlug) {
                const { data: bundle } = await supabase
                  .from('marketplace_bundles')
                  .select('id, key_ids')
                  .eq('slug', bundleSlug)
                  .single();
                if (bundle) {
                  resolvedBundleId = bundle.id;
                  
                  // Grant entitlements for all keys in bundle
                  const keyIds = bundle.key_ids as string[];
                  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
                  const priceId = lineItems.data[0]?.price?.id || '';

                  for (const keyId of keyIds) {
                    await grantEntitlement(
                      tenant.tenantId,
                      tenant.tenantType,
                      keyId,
                      'stripe',
                      {
                        stripePriceId: priceId || undefined,
                      }
                    );
                  }

                  // Track analytics
                  await supabase.from('marketplace_analytics').insert({
                    event_type: 'bundle_upgrade',
                    bundle_id: resolvedBundleId,
                    user_id: userId,
                    tenant_id: tenant.tenantId,
                    tenant_type: tenant.tenantType,
                  });
                }
              }
            } catch (error) {
              logger.error('Failed to grant bundle entitlements', error as Error, {
                requestId: req.headers['x-request-id'] as string,
                userId,
                bundleId: resolvedBundleId,
                eventId: event.id,
              });
              // Don't fail the webhook, but log the error
            }
          } else {
            // Regular subscription purchase
            // Get tier information from price ID
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
            const priceId = lineItems.data[0]?.price?.id || '';
            const { tier, guaranteeCoverage, integrationAccess } = getTierFromPriceId(priceId);

            // Update user subscription status and tier
            await supabase
              .from('user_profiles')
              .update({
                subscription_status: 'active',
                subscription_tier: tier,
                stripe_customer_id: session.customer as string,
                guarantee_coverage: guaranteeCoverage,
                integration_access: integrationAccess,
              })
              .eq('user_id', userId);
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          // Check if this subscription is for marketplace packs
          const priceId = subscription.items.data[0]?.price?.id || '';
          const productId = subscription.items.data[0]?.price?.product as string;

          // Check if product metadata indicates marketplace pack
          let isMarketplaceSubscription = false;
          if (productId) {
            try {
              const product = await stripe.products.retrieve(productId);
              isMarketplaceSubscription = product.metadata?.type === 'marketplace_pack' || 
                                         product.metadata?.subscription_type === 'catalog_access';
            } catch {
              // Ignore errors
            }
          }

          if (isMarketplaceSubscription) {
            // Handle marketplace subscription updates
            const isActive = subscription.status === 'active';
            const periodEnd = subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null;
            
            // Find entitlements linked to this subscription
            const { data: entitlements } = await supabase
              .from('marketplace_entitlements')
              .select('id, key_id')
              .eq('stripe_subscription_id', subscription.id);

            if (entitlements) {
              for (const entitlement of entitlements) {
                await supabase
                  .from('marketplace_entitlements')
                  .update({
                    status: isActive ? 'active' : 'inactive',
                    ends_at: isActive ? null : periodEnd,
                  })
                  .eq('id', entitlement.id);
              }
            }
          } else {
            // Regular subscription update
            const { tier, guaranteeCoverage, integrationAccess } = getTierFromPriceId(priceId);
            
            const isActive = subscription.status === 'active';
            const periodEnd = subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null;
            
            await supabase
              .from('user_profiles')
              .update({
                subscription_status: isActive ? 'active' : (event.type === 'customer.subscription.deleted' ? 'canceled' : 'inactive'),
                subscription_tier: isActive ? tier : 'free',
                subscription_current_period_end: periodEnd,
                guarantee_coverage: isActive ? guaranteeCoverage : [],
                integration_access: isActive ? integrationAccess : [],
              })
              .eq('user_id', profile.user_id);
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;

        if (subscriptionId) {
          // Find subscription entitlements and extend them
          const { data: entitlements } = await supabase
            .from('marketplace_entitlements')
            .select('id')
            .eq('stripe_subscription_id', subscriptionId);

          if (entitlements) {
            const periodEnd = invoice.period_end 
              ? new Date(invoice.period_end * 1000).toISOString()
              : null;

            for (const entitlement of entitlements) {
              await supabase
                .from('marketplace_entitlements')
                .update({
                  status: 'active',
                  ends_at: periodEnd,
                })
                .eq('id', entitlement.id);
            }
          }

          // Update user subscription status
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (profile) {
            await supabase
              .from('user_profiles')
              .update({
                subscription_status: 'active',
                subscription_current_period_end: invoice.period_end 
                  ? new Date(invoice.period_end * 1000).toISOString()
                  : null,
              })
              .eq('user_id', profile.user_id);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;

        if (subscriptionId) {
          // Check payment attempt count
          const attemptCount = invoice.attempt_count || 0;
          const daysSinceFailure = invoice.next_payment_attempt 
            ? Math.floor((invoice.next_payment_attempt * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
            : 0;

          // Grace period: 7 days
          if (attemptCount === 1 && daysSinceFailure <= 7) {
            // First failure: Mark past_due, keep access
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('user_id')
              .eq('stripe_customer_id', customerId)
              .single();

            if (profile) {
              await supabase
                .from('user_profiles')
                .update({
                  subscription_status: 'past_due',
                })
                .eq('user_id', profile.user_id);
            }
          } else {
            // After grace period: Revoke access
            const { revokeEntitlement, resolveTenantContext } = await import('../lib/marketplace/entitlements.js');
            
            const { data: entitlements } = await supabase
              .from('marketplace_entitlements')
              .select('tenant_id, tenant_type, key_id')
              .eq('stripe_subscription_id', subscriptionId);

            if (entitlements) {
              for (const entitlement of entitlements) {
                try {
                  await revokeEntitlement(
                    entitlement.tenant_id,
                    entitlement.key_id,
                    entitlement.tenant_type
                  );
                } catch (error) {
                  logger.error('Failed to revoke entitlement', error as Error, {
                    requestId: req.headers['x-request-id'] as string,
                    tenantId: entitlement.tenant_id,
                    keyId: entitlement.key_id,
                    eventId: event.id,
                  });
                }
              }
            }

            // Update subscription status
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('user_id')
              .eq('stripe_customer_id', customerId)
              .single();

            if (profile) {
              await supabase
                .from('user_profiles')
                .update({
                  subscription_status: 'inactive',
                })
                .eq('user_id', profile.user_id);
            }
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        // Find checkout session from charge
        const paymentIntentId = charge.payment_intent as string;
        
        if (paymentIntentId) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            const sessionId = paymentIntent.metadata?.checkout_session_id;

            if (sessionId) {
              const session = await stripe.checkout.sessions.retrieve(sessionId);
              const userId = session.client_reference_id || session.metadata?.userId;
              const purchaseType = session.metadata?.purchaseType;

              if (userId) {
                const { revokeEntitlement, resolveTenantContext } = await import('../lib/marketplace/entitlements.js');
                const tenant = await resolveTenantContext(userId);

                if (purchaseType === 'key') {
                  const keyId = session.metadata?.keyId;
                  if (keyId) {
                    try {
                      await revokeEntitlement(tenant.tenantId, keyId, tenant.tenantType);
                      
                      // Mark entitlement as refunded
                      await supabase
                        .from('marketplace_entitlements')
                        .update({ status: 'inactive' })
                        .eq('tenant_id', tenant.tenantId)
                        .eq('tenant_type', tenant.tenantType)
                        .eq('key_id', keyId);
                    } catch (error) {
                      logger.error('Failed to revoke entitlement on refund', error as Error, {
                        requestId: req.headers['x-request-id'] as string,
                        userId,
                        keyId,
                        eventId: event.id,
                      });
                    }
                  }
                } else if (purchaseType === 'bundle') {
                  const bundleId = session.metadata?.bundleId;
                  if (bundleId) {
                    // Get all keys in bundle
                    const { data: bundle } = await supabase
                      .from('marketplace_bundles')
                      .select('key_ids')
                      .eq('id', bundleId)
                      .single();

                    if (bundle) {
                      const keyIds = bundle.key_ids as string[];
                      for (const keyId of keyIds) {
                        try {
                          await revokeEntitlement(tenant.tenantId, keyId, tenant.tenantType);
                        } catch (error) {
                          logger.error('Failed to revoke bundle entitlement on refund', error as Error, {
                            requestId: req.headers['x-request-id'] as string,
                            userId,
                            bundleId,
                            eventId: event.id,
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            logger.error('Failed to process refund', error as Error, {
              requestId: req.headers['x-request-id'] as string,
              chargeId: charge.id,
              eventId: event.id,
            });
          }
        }
        break;
      }

      default:
        logger.warn('Unhandled Stripe event type', {
          requestId: req.headers['x-request-id'] as string,
          eventType: event.type,
          eventId: event.id,
        });
    }

    // Mark event as successfully processed
    await supabase
      .from('stripe_webhook_events')
      .update({ status: 'processed' })
      .eq('stripe_event_id', event.id)
      .catch((err) => {
        // Log but don't fail if update fails
        logger.warn('Failed to update webhook event status', {
          requestId: req.headers['x-request-id'] as string,
          eventId: event.id,
          error: err,
        });
      });

    res.json({ received: true });
  })
);

export { router as billingRouter };
