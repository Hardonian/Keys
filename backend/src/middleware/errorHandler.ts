import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Custom error class
 */
export class AppError extends Error {
  statusCode: number;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
  });

  // Determine status code
  const statusCode = (err as AppError).statusCode || 500;
  const code = (err as AppError).code || 'INTERNAL_ERROR';
  const details = (err as AppError).details;

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response: Record<string, any> = {
    error: {
      message: err.message || 'Internal server error',
      code,
      ...(isDevelopment && { stack: err.stack }),
      ...(details && { details }),
    },
  };

  // Add request ID if available
  if (req.headers['x-request-id']) {
    response.requestId = req.headers['x-request-id'];
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
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
    },
  });
}

/**
 * Validation error helper
 */
export function validationError(message: string, details?: any): AppError {
  return new AppError(message, 400, 'VALIDATION_ERROR', details);
}

/**
 * Authentication error helper
 */
export function authError(message: string = 'Authentication required'): AppError {
  return new AppError(message, 401, 'AUTH_ERROR');
}

/**
 * Authorization error helper
 */
export function authorizationError(message: string = 'Insufficient permissions'): AppError {
  return new AppError(message, 403, 'AUTHORIZATION_ERROR');
}

/**
 * Not found error helper
 */
export function notFoundError(message: string = 'Resource not found'): AppError {
  return new AppError(message, 404, 'NOT_FOUND');
}
