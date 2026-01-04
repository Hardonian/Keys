import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { z } from 'zod';
import Stripe from 'stripe';

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
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;

        if (userId) {
          // Check if this is a marketplace pack purchase
          const packSlug = session.metadata?.packSlug;
          const packId = session.metadata?.packId;

          if (packSlug || packId) {
            // Grant marketplace entitlement
            try {
              const { grantEntitlement, resolveTenantContext } = await import('../lib/marketplace/entitlements.js');
              const tenant = await resolveTenantContext(userId);

              // Resolve pack_id if slug was provided
              let resolvedPackId = packId;
              if (!resolvedPackId && packSlug) {
                const { data: pack } = await supabase
                  .from('marketplace_packs')
                  .select('id')
                  .eq('slug', packSlug)
                  .single();
                if (pack) {
                  resolvedPackId = pack.id;
                }
              }

              if (resolvedPackId) {
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
                const priceId = lineItems.data[0]?.price?.id || '';
                const subscriptionId = session.subscription as string | null;

                await grantEntitlement(
                  tenant.tenantId,
                  tenant.tenantType,
                  resolvedPackId,
                  'stripe',
                  {
                    stripeSubscriptionId: subscriptionId || undefined,
                    stripePriceId: priceId || undefined,
                  }
                );
              }
            } catch (error) {
              console.error('Failed to grant marketplace entitlement:', error);
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
              isMarketplaceSubscription = product.metadata?.type === 'marketplace_pack';
            } catch {
              // Ignore errors
            }
          }

          if (isMarketplaceSubscription) {
            // Handle marketplace subscription updates
            const isActive = subscription.status === 'active';
            
            // Find entitlements linked to this subscription
            const { data: entitlements } = await supabase
              .from('marketplace_entitlements')
              .select('id, pack_id')
              .eq('stripe_subscription_id', subscription.id);

            if (entitlements) {
              for (const entitlement of entitlements) {
                await supabase
                  .from('marketplace_entitlements')
                  .update({
                    status: isActive ? 'active' : 'inactive',
                    ends_at: isActive ? null : new Date().toISOString(),
                  })
                  .eq('id', entitlement.id);
              }
            }
          } else {
            // Regular subscription update
            const { tier, guaranteeCoverage, integrationAccess } = getTierFromPriceId(priceId);
            
            const isActive = subscription.status === 'active';
            
            await supabase
              .from('user_profiles')
              .update({
                subscription_status: isActive ? 'active' : 'inactive',
                subscription_tier: isActive ? tier : 'free',
                guarantee_coverage: isActive ? guaranteeCoverage : [],
                integration_access: isActive ? integrationAccess : [],
              })
              .eq('user_id', profile.user_id);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  })
);

export { router as billingRouter };
