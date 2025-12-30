import { Router } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validation.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { logger } from '../utils/logger.js';
import { AuthenticationError } from '../types/errors.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const exchangeTokenSchema = z.object({
  code: z.string().min(1),
  extensionId: z.string().min(1),
  state: z.string().optional(),
});

/**
 * Exchange short-lived auth code for extension token
 * POST /extension-auth/exchange
 */
router.post(
  '/exchange',
  authRateLimiter,
  validateBody(exchangeTokenSchema),
  asyncHandler(async (req, res) => {
    const { code, extensionId, state } = req.body;
    const requestId = req.headers['x-request-id'] as string;

    // Verify code and get user session
    // In production, you'd store codes in Redis with short TTL
    // For now, we'll use Supabase to verify the code
    try {
      // Exchange code for session (implementation depends on your auth flow)
      // This is a simplified version - adjust based on your actual auth code storage
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        logger.warn('Extension auth exchange failed: invalid code', {
          extensionId,
          requestId,
        });
        throw new AuthenticationError('Invalid or expired auth code');
      }

      const session = sessionData.session;

      // Generate extension-specific token (short-lived, 24 hours)
      // In production, you might want to use a different token format
      const extensionToken = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at || Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        expires_in: 24 * 60 * 60, // 24 hours
      };

      logger.info('Extension token exchanged successfully', {
        userId: session.user.id,
        extensionId,
        requestId,
      });

      res.json({
        token: extensionToken.access_token,
        refreshToken: extensionToken.refresh_token,
        expiresIn: extensionToken.expires_in,
        expiresAt: extensionToken.expires_at,
      });
    } catch (error) {
      logger.error('Extension auth exchange failed', error as Error, {
        extensionId,
        requestId,
      });
      throw error;
    }
  })
);

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
  extensionId: z.string().min(1),
});

/**
 * Refresh extension token
 * POST /extension-auth/refresh
 */
router.post(
  '/refresh',
  authRateLimiter,
  validateBody(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken, extensionId } = req.body;
    const requestId = req.headers['x-request-id'] as string;

    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        logger.warn('Extension token refresh failed', {
          extensionId,
          requestId,
        });
        throw new AuthenticationError('Invalid or expired refresh token');
      }

      const session = data.session;

      logger.info('Extension token refreshed successfully', {
        userId: session.user.id,
        extensionId,
        requestId,
      });

      res.json({
        token: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in || 24 * 60 * 60,
        expiresAt: session.expires_at || Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      });
    } catch (error) {
      logger.error('Extension token refresh failed', error as Error, {
        extensionId,
        requestId,
      });
      throw error;
    }
  })
);

/**
 * Validate extension token
 * POST /extension-auth/validate
 */
router.post(
  '/validate',
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    const extensionId = req.body.extensionId || req.headers['x-extension-id'];
    const requestId = req.headers['x-request-id'] as string;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        valid: false,
        error: 'Missing or invalid authorization header',
        requestId,
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        logger.warn('Extension token validation failed', {
          extensionId,
          requestId,
        });
        res.json({
          valid: false,
          error: 'Invalid or expired token',
          requestId,
        });
        return;
      }

      logger.debug('Extension token validated', {
        userId: user.id,
        extensionId,
        requestId,
      });

      res.json({
        valid: true,
        userId: user.id,
        requestId,
      });
    } catch (error) {
      logger.error('Extension token validation error', error as Error, {
        extensionId,
        requestId,
      });
      res.status(500).json({
        valid: false,
        error: 'Validation error',
        requestId,
      });
    }
  })
);

export { router as extensionAuthRouter };
