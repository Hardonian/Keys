import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../types/errors';

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const retryAfter = Math.ceil(
      (req.rateLimit?.resetTime || Date.now() + 900000 - Date.now()) / 1000
    );
    throw new RateLimitError('Rate limit exceeded', retryAfter);
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * User-specific rate limiter
 */
export function userRateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = (req as any).userId;
  
  if (!userId) {
    // Fall back to IP-based limiting
    return apiRateLimiter(req, res, next);
  }

  // In production, use Redis-based rate limiting per user
  // For now, use memory-based limiting
  const userLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, // Higher limit for authenticated users
    keyGenerator: () => userId,
    standardHeaders: true,
    legacyHeaders: false,
  });

  userLimiter(req, res, next);
}
