import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { createProfileSchema, updateProfileSchema } from '../validation/schemas.js';
import { NotFoundError, DatabaseError } from '../types/errors.js';
import { logger } from '../utils/logger.js';
import { getCache, setCache, deleteCache, cacheKeys } from '../cache/redis.js';
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination.js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get user profile
router.get(
  '/:userId',
  validateParams(z.object({ userId: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const requestId = req.headers['x-request-id'] as string;

    // Try cache first
    const cacheKey = cacheKeys.userProfile(userId);
    const cached = await getCache(cacheKey);
    if (cached) {
      logger.debug('Profile cache hit', { userId, requestId });
      return res.json(cached);
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundError('User profile');
    }

    // Cache for 5 minutes
    await setCache(cacheKey, data, 300);

    logger.info('Profile fetched', { userId, requestId });
    res.json(data);
  })
);

// Create user profile
router.post(
  '/',
  validateBody(createProfileSchema),
  asyncHandler(async (req, res) => {
    const profile = req.body;
    const userId = (req as any).userId || profile.user_id;
    const requestId = req.headers['x-request-id'] as string;

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ ...profile, user_id: userId })
      .select()
      .single();

    if (error) {
      logger.error('Error creating profile', new Error(error.message), { userId, requestId });
      throw new DatabaseError('Failed to create profile', { error: error.message });
    }

    // Invalidate cache
    await deleteCache(cacheKeys.userProfile(userId));

    logger.info('Profile created', { userId, requestId });
    res.status(201).json(data);
  })
);

// Update user profile
router.patch(
  '/:userId',
  validateParams(z.object({ userId: z.string().min(1) })),
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;
    const requestId = req.headers['x-request-id'] as string;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating profile', new Error(error.message), { userId, requestId });
      throw new DatabaseError('Failed to update profile', { error: error.message });
    }

    if (!data) {
      throw new NotFoundError('User profile');
    }

    // Invalidate cache
    await deleteCache(cacheKeys.userProfile(userId));

    logger.info('Profile updated', { userId, requestId });
    res.json(data);
  })
);

// List profiles (admin only)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const pagination = getPaginationParams(req.query);
    const requestId = req.headers['x-request-id'] as string;

    const { data, error, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .range(
        (pagination.page - 1) * pagination.limit,
        pagination.page * pagination.limit - 1
      )
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error listing profiles', new Error(error.message), { requestId });
      throw new DatabaseError('Failed to list profiles', { error: error.message });
    }

    const response = createPaginatedResponse(data || [], count || 0, pagination);
    res.json(response);
  })
);

export { router as profilesRouter };
