import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { createProfileSchema, updateProfileSchema } from '../validation/schemas.js';
import { NotFoundError, DatabaseError, AuthorizationError } from '../types/errors.js';
import { logger } from '../utils/logger.js';
import { getCache, setCache, deleteCache, cacheKeys } from '../cache/redis.js';
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { checkLimit } from '../services/usageMetering.js';

const router = Router();
let supabaseClient: SupabaseClient<any> | null = null;
function getSupabaseAdminClient() {
  const isTestRuntime = process.env.NODE_ENV === 'test' || typeof (import.meta as any)?.vitest !== 'undefined';
  if (!isTestRuntime && supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (isTestRuntime) {
    return createClient<any>(url || 'http://127.0.0.1:54321', key || 'test-service-role') as SupabaseClient<any>;
  }

  if (!url || !key) throw new Error('Supabase admin client is not configured');
  supabaseClient = createClient<any>(url, key) as SupabaseClient<any>;
  return supabaseClient;
}

// Get user profile
router.get(
  '/:userId',
  authMiddleware,
  validateParams(z.object({ userId: z.string().min(1) })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { userId } = req.params;
    const authenticatedUserId = req.userId!;
    const requestId = req.headers['x-request-id'] as string;

    // Enforce ownership: users can only access their own profile unless admin
    if (userId !== authenticatedUserId && req.user?.role !== 'admin') {
      throw new AuthorizationError('You can only access your own profile');
    }

    // Try cache first
    const cacheKey = cacheKeys.userProfile(userId);
    const cached = await getCache(cacheKey);
    if (cached) {
      logger.debug('Profile cache hit', { userId, requestId });
      return res.json(cached);
    }

    const { data, error } = await getSupabaseAdminClient()
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
  authMiddleware,
  validateBody(createProfileSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const profile = req.body;
    const userId = req.userId!; // Always use authenticated user ID
    const requestId = req.headers['x-request-id'] as string;

    // Ignore user_id from body if present - always use authenticated user
    const { user_id, ...profileData } = profile;

    const { data, error } = await getSupabaseAdminClient()
      .from('user_profiles')
      .insert({ ...profileData, user_id: userId })
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
  authMiddleware,
  validateParams(z.object({ userId: z.string().min(1) })),
  validateBody(updateProfileSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { userId } = req.params;
    const authenticatedUserId = req.userId!;
    const updates = req.body;
    const requestId = req.headers['x-request-id'] as string;

    // Enforce ownership: users can only update their own profile unless admin
    if (userId !== authenticatedUserId && req.user?.role !== 'admin') {
      throw new AuthorizationError('You can only update your own profile');
    }

    // Remove user_id from updates if present - cannot change ownership
    const { user_id, ...updateData } = updates;

    const { data, error } = await getSupabaseAdminClient()
      .from('user_profiles')
      .update(updateData)
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
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // Only admins can list all profiles
    if (req.user?.role !== 'admin') {
      throw new AuthorizationError('Admin access required');
    }
    const pagination = getPaginationParams(req.query);
    const requestId = req.headers['x-request-id'] as string;

    const { data, error, count } = await getSupabaseAdminClient()
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
