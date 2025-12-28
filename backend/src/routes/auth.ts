import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validation.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { AuthenticationError } from '../types/errors.js';
import { logger } from '../utils/logger.js';
import { setUserContext, clearUserContext } from '../integrations/sentry.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

// Sign in
router.post(
  '/signin',
  authRateLimiter,
  validateBody(signInSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const requestId = req.headers['x-request-id'] as string;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      logger.warn('Sign in failed', { email, requestId });
      throw new AuthenticationError('Invalid email or password');
    }

    setUserContext(data.user.id, data.user.email);

    logger.info('User signed in', { userId: data.user.id, requestId });
    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: data.session,
    });
  })
);

// Sign up
router.post(
  '/signup',
  authRateLimiter,
  validateBody(signUpSchema),
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;
    const requestId = req.headers['x-request-id'] as string;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error || !data.user) {
      logger.error('Sign up failed', new Error(error?.message || 'Unknown error'), {
        email,
        requestId,
      });
      throw new AuthenticationError(error?.message || 'Failed to create account');
    }

    logger.info('User signed up', { userId: data.user.id, requestId });
    res.status(201).json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: data.session,
    });
  })
);

// Sign out
router.post(
  '/signout',
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const requestId = req.headers['x-request-id'] as string;

    if (token) {
      await supabase.auth.signOut();
      clearUserContext();
    }

    logger.info('User signed out', { requestId });
    res.json({ message: 'Signed out successfully' });
  })
);

// Get current user
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const requestId = req.headers['x-request-id'] as string;

    if (!token) {
      throw new AuthenticationError();
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AuthenticationError();
    }

    logger.debug('Current user fetched', { userId: user.id, requestId });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
    });
  })
);

export { router as authRouter };
