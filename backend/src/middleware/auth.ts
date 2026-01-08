import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient<any> | null = null;

function getSupabaseAdminClient(): SupabaseClient<any> {
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

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

function isAllowlistedAdmin(userId: string | undefined): boolean {
  if (!userId) return false;
  const raw = process.env.ADMIN_USER_IDS || '';
  if (!raw.trim()) return false;
  const set = new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  return set.has(userId);
}

function getUserRole(user: { app_metadata?: any; user_metadata?: any; id?: string }): string | undefined {
  // Prefer app_metadata (not user-editable in Supabase).
  const appRole = user?.app_metadata?.role;
  if (typeof appRole === 'string' && appRole) return appRole;

  // Optional bootstrap: allowlist specific user IDs as admins via env.
  if (isAllowlistedAdmin(user?.id)) return 'admin';

  // Do NOT trust user_metadata.role for authorization.
  return undefined;
}

/**
 * Auth middleware to verify JWT token and extract user info
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Missing or invalid authorization header',
        },
        requestId: req.headers['x-request-id'],
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await getSupabaseAdminClient().auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ 
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid or expired token',
        },
        requestId: req.headers['x-request-id'],
      });
      return;
    }

    // Attach user info to request
    req.userId = user.id;
    req.user = {
      id: user.id,
      email: user.email,
      role: getUserRole(user),
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication error',
      },
      requestId: req.headers['x-request-id'],
    });
  }
}

/**
 * Optional auth - doesn't fail if no token, but attaches user if present
 */
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const {
        data: { user },
      } = await getSupabaseAdminClient().auth.getUser(token);

      if (user) {
        req.userId = user.id;
        req.user = {
          id: user.id,
          email: user.email,
          role: getUserRole(user),
        };
      }
    }

    next();
  } catch (error) {
    // Continue without auth on error
    next();
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRole = req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
