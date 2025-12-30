import { Request, Response, NextFunction } from 'express';
import { apmService } from '../services/apmService.js';
import type { AuthenticatedRequest } from './auth.js';

/**
 * APM middleware to track request performance
 */
export function apmMiddleware(
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string;

  // Track response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = (req as AuthenticatedRequest).userId;

    apmService.trackRequest({
      endpoint: req.path,
      method: req.method,
      duration,
      statusCode: res.statusCode,
      userId,
      timestamp: new Date(),
      metadata: {
        requestId,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });
  });

  next();
}

/**
 * Error tracking middleware
 */
export function errorTrackingMiddleware(
  error: Error,
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const userId = (req as AuthenticatedRequest).userId;

  apmService.trackError({
    errorType: error.constructor.name,
    errorMessage: error.message,
    endpoint: req.path,
    userId,
    stackTrace: error.stack,
    timestamp: new Date(),
    metadata: {
      method: req.method,
      requestId: req.headers['x-request-id'],
    },
  });

  next(error);
}
