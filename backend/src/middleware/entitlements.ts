import { Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from './auth.js';
import { logger } from '../utils/logger.js';

// Extend AuthenticatedRequest interface
export interface RequestWithEntitlements extends AuthenticatedRequest {
  entitlements?: {
    subscriptionStatus: string;
    premiumEnabled: boolean;
    stripeCustomerId?: string;
  };
}

let supabaseClient: SupabaseClient<any> | null = null;

function getSupabaseAdminClient(): SupabaseClient<any> {
  const isTestRuntime = process.env.NODE_ENV === 'test' || typeof (import.meta as any)?.vitest !== 'undefined';
  if (!isTestRuntime && supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // In tests we allow a safe local fallback so vitest can mock createClient()
  // without requiring real env vars. Also avoid caching across tests.
  if (isTestRuntime) {
    return createClient<any>(url || 'http://127.0.0.1:54321', key || 'test-service-role') as SupabaseClient<any>;
  }

  if (!url || !key) throw new Error('Supabase admin client is not configured');

  supabaseClient = createClient<any>(url, key) as SupabaseClient<any>;
  return supabaseClient;
}

export interface EntitlementCheck {
  requirePremium?: boolean;
  requireActiveSubscription?: boolean;
  checkUsageLimit?: boolean;
}

/**
 * Middleware to check user entitlements (subscription status, premium features, usage limits)
 */
export function entitlementsMiddleware(options: EntitlementCheck = {}) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.userId;
    const requestId = req.headers['x-request-id'] as string;

    if (!userId) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        },
        requestId,
      });
      return;
    }

    try {
      // Fast-path: if no subscription/premium requirements are requested, avoid a DB round-trip.
      // (Usage limits are enforced separately via usage metering.)
      if (!options.requireActiveSubscription && !options.requirePremium) {
        (req as RequestWithEntitlements).entitlements = {
          subscriptionStatus: 'unknown',
          premiumEnabled: false,
        };
        next();
        return;
      }

      const supabase = getSupabaseAdminClient();
      // Fetch user profile with subscription status
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('subscription_status, premium_features, stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found, which is OK for new users
        logger.error('Error fetching user profile', new Error(error.message), {
          userId,
          requestId,
        });
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to check entitlements',
          },
          requestId,
        });
        return;
      }

      const subscriptionStatus = profile?.subscription_status || 'inactive';
      const premiumFeatures = profile?.premium_features || { enabled: false };

      // Check active subscription requirement
      if (options.requireActiveSubscription) {
        if (subscriptionStatus !== 'active') {
          logger.warn('Access denied: subscription required', {
            userId,
            subscriptionStatus,
            requestId,
          });
          res.status(403).json({
            error: {
              code: 'SUBSCRIPTION_REQUIRED',
              message: 'Active subscription required',
              upgradeUrl: '/billing/portal',
            },
            requestId,
          });
          return;
        }
      }

      // Check premium features requirement
      if (options.requirePremium) {
        if (!premiumFeatures.enabled) {
          logger.warn('Access denied: premium features required', {
            userId,
            requestId,
          });
          res.status(403).json({
            error: {
              code: 'PREMIUM_REQUIRED',
              message: 'Premium features required',
              upgradeUrl: '/billing/portal',
            },
            requestId,
          });
          return;
        }
      }

      // Attach entitlement info to request for downstream use
      (req as RequestWithEntitlements).entitlements = {
        subscriptionStatus,
        premiumEnabled: premiumFeatures.enabled || false,
        stripeCustomerId: profile?.stripe_customer_id,
      };

      next();
    } catch (error) {
      logger.error('Entitlements check failed', error as Error, {
        userId,
        requestId,
      });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check entitlements',
        },
        requestId,
      });
    }
  };
}

