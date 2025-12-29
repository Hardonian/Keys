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
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
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
          // Update user subscription status
          await supabase
            .from('user_profiles')
            .update({
              subscription_status: 'active',
              stripe_customer_id: session.customer as string,
            })
            .eq('user_id', userId);
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
          await supabase
            .from('user_profiles')
            .update({
              subscription_status: subscription.status === 'active' ? 'active' : 'inactive',
            })
            .eq('user_id', profile.user_id);
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
