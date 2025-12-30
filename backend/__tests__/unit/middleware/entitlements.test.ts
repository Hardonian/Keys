import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { entitlementsMiddleware } from '../../../src/middleware/entitlements.js';
import { AuthenticatedRequest } from '../../../src/middleware/auth.js';
import * as supabaseModule from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js');

describe('entitlementsMiddleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 'test-user-id',
      headers: {
        'x-request-id': 'test-request-id',
      },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  it('should allow access when no requirements specified', async () => {
    const middleware = entitlementsMiddleware();
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                subscription_status: 'inactive',
                premium_features: { enabled: false },
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.spyOn(supabaseModule, 'createClient').mockReturnValue(mockSupabase as any);

    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should deny access when subscription required but inactive', async () => {
    const middleware = entitlementsMiddleware({ requireActiveSubscription: true });
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                subscription_status: 'inactive',
                premium_features: { enabled: false },
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.spyOn(supabaseModule, 'createClient').mockReturnValue(mockSupabase as any);

    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'SUBSCRIPTION_REQUIRED',
        }),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should allow access when subscription required and active', async () => {
    const middleware = entitlementsMiddleware({ requireActiveSubscription: true });
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                subscription_status: 'active',
                premium_features: { enabled: false },
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.spyOn(supabaseModule, 'createClient').mockReturnValue(mockSupabase as any);

    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.entitlements).toEqual({
      subscriptionStatus: 'active',
      premiumEnabled: false,
    });
  });

  it('should deny access when premium required but not enabled', async () => {
    const middleware = entitlementsMiddleware({ requirePremium: true });
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                subscription_status: 'inactive',
                premium_features: { enabled: false },
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.spyOn(supabaseModule, 'createClient').mockReturnValue(mockSupabase as any);

    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'PREMIUM_REQUIRED',
        }),
      })
    );
  });

  it('should return 401 when userId is missing', async () => {
    const middleware = entitlementsMiddleware();
    delete mockReq.userId;

    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
