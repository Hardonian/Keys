import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

export type TenantType = 'org' | 'user';

export interface TenantContext {
  tenantId: string;
  tenantType: TenantType;
}

export interface TenantAuthenticatedRequest extends AuthenticatedRequest {
  tenant: TenantContext;
}

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    
    supabaseClient = createClient(url, key);
  }
  
  return supabaseClient;
}

/**
 * Resolve tenant context from user_id
 * Returns the primary tenant (org if user belongs to one, otherwise user)
 * CRITICAL: This function must be called server-side only
 */
export async function resolveTenantContext(userId: string): Promise<TenantContext> {
  try {
    const supabase = getSupabaseClient();
    
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (orgMember) {
      return {
        tenantId: orgMember.org_id,
        tenantType: 'org',
      };
    }

    return {
      tenantId: userId,
      tenantType: 'user',
    };
  } catch (error) {
    logger.error('Failed to resolve tenant context', error as Error, { userId });
    throw error;
  }
}

/**
 * Tenant context middleware
 * MUST be placed AFTER authMiddleware
 * Ensures every authenticated request has a validated tenant context
 */
export function requireTenantMiddleware() {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({
          error: {
            code: 'TENANT_CONTEXT_ERROR',
            message: 'User ID required for tenant resolution',
          },
          requestId: req.headers['x-request-id'],
        });
        return;
      }

      const tenant = await resolveTenantContext(req.userId);

      (req as TenantAuthenticatedRequest).tenant = tenant;

      next();
    } catch (error) {
      logger.error('Tenant context middleware error', error as Error);
      res.status(500).json({
        error: {
          code: 'TENANT_CONTEXT_ERROR',
          message: 'Failed to resolve tenant context',
        },
        requestId: req.headers['x-request-id'],
      });
    }
  };
}

/**
 * Get tenant from request - type-safe accessor
 */
export function getTenant(req: AuthenticatedRequest): TenantContext | null {
  return (req as TenantAuthenticatedRequest).tenant ?? null;
}

/**
 * Assert tenant exists - throws if tenant not set
 */
export function assertTenant(req: AuthenticatedRequest): TenantContext {
  const tenant = getTenant(req);
  if (!tenant) {
    throw new Error('Tenant context not established. Ensure requireTenantMiddleware is used.');
  }
  return tenant;
}
