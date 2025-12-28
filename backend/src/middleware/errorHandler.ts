import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../types/errors';
import { logger } from '../utils/logger';

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate request ID if not present
  const requestId = (req.headers['x-request-id'] as string) || 
                    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Determine if this is an AppError
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const errorCode = isAppError ? err.code : ErrorCode.INTERNAL_ERROR;
  const context = isAppError ? err.context : undefined;

  // Log error with context
  logger.error(
    err.message,
    err,
    {
      requestId,
      userId: (req as any).userId,
      url: req.url,
      method: req.method,
      statusCode,
      errorCode,
      ...context,
    }
  );

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response: Record<string, any> = {
    error: {
      code: errorCode,
      message: err.message || 'Internal server error',
      ...(isDevelopment && { stack: err.stack }),
      ...(context && { context }),
    },
    requestId,
  };

  // Add retry-after header for rate limit errors
  if (errorCode === ErrorCode.RATE_LIMIT_ERROR && context?.retryAfter) {
    res.setHeader('Retry-After', context.retryAfter);
  }

  res.status(statusCode).json(response);
}

/**
 * Async error wrapper - wraps async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  const requestId = (req.headers['x-request-id'] as string) || 
                    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.warn('Route not found', {
    requestId,
    url: req.url,
    method: req.method,
  });

  res.status(404).json({
    error: {
      code: ErrorCode.NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
    },
    requestId,
  });
}
