import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  costMultiplier?: number; // Multiply limit by cost (for cost-based throttling)
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
    cost: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetAt < now) {
        delete this.store[key];
      }
    }
  }

  check(
    identifier: string,
    config: RateLimitConfig,
    cost: number = 0
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store[identifier];

    if (!entry || entry.resetAt < now) {
      // New window or expired
      const maxRequests = config.costMultiplier
        ? Math.floor(config.maxRequests / (1 + cost * config.costMultiplier))
        : config.maxRequests;

      this.store[identifier] = {
        count: 1,
        resetAt: now + config.windowMs,
        cost: cost,
      };

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + config.windowMs,
      };
    }

    // Check if limit exceeded
    const maxRequests = config.costMultiplier
      ? Math.floor(config.maxRequests / (1 + entry.cost * config.costMultiplier))
      : config.maxRequests;

    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    entry.cost += cost;

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store = {};
  }
}

const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware factory
 */
export function rateLimit(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Get identifier (user ID if authenticated, IP otherwise)
    const identifier =
      (req as AuthenticatedRequest).userId || req.ip || req.socket.remoteAddress || 'unknown';

    // Get cost from request (if available)
    const cost = (req.body?.cost_usd as number) || 0;

    const result = rateLimiter.check(identifier, config, cost);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    if (!result.allowed) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again after ${new Date(result.resetAt).toISOString()}`,
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      });
      return;
    }

    next();
  };
}

/**
 * Per-user rate limit (requires auth)
 */
export const userRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

/**
 * Per-endpoint rate limit (stricter)
 */
export const endpointRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
});

/**
 * Cost-based rate limit (for expensive operations)
 */
export const costBasedRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 1000, // Base limit
  costMultiplier: 100, // Reduce limit based on cost
});
