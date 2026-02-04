import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { logger } from '../utils/logger.js';
import { securityHeadersMiddleware, requestSigningMiddleware } from './securityHardening.js';

const requestLogSampleRate = (() => {
  const raw = process.env.REQUEST_LOG_SAMPLE_RATE;
  if (!raw) return 1;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return 1;
  return Math.min(1, Math.max(0, parsed));
})();

const requestLogIgnorePaths = new Set(['/metrics']);

/**
 * Security headers middleware (uses enhanced hardening)
 */
export function securityMiddleware() {
  return securityHeadersMiddleware();
}

/**
 * Request ID middleware - adds unique ID to each request
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string ||
                    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
}

/**
 * CORS configuration
 */
export function corsMiddleware() {
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    if (origin && (allowedOrigins.includes(origin) || isDevelopment)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  };
}

/**
 * Request logging middleware
 */
export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string;
  const shouldSkip = requestLogIgnorePaths.has(req.path);
  const shouldSample = requestLogSampleRate >= 1 || Math.random() < requestLogSampleRate;
  const shouldLog = !shouldSkip && shouldSample;

  if (shouldLog) {
    logger.info('Request started', {
      requestId,
      method: req.method,
      url: req.url,
      userId: (req as any).userId,
    });
  }

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (shouldLog || res.statusCode >= 400) {
      logger.info('Request completed', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    }
  });

  next();
}
