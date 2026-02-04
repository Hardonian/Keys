import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

interface RequestMetrics {
  startTime: number;
  method: string;
  path: string;
  statusCode?: number;
  error?: Error;
}

const metricsSampleRate = (() => {
  const raw = process.env.METRICS_LOG_SAMPLE_RATE;
  if (!raw) return 1;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return 1;
  return Math.min(1, Math.max(0, parsed));
})();

const metricsIgnorePaths = new Set(['/metrics']);

/**
 * Middleware to track request metrics (latency, error rate, etc.)
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string;
  const metrics: RequestMetrics = {
    startTime,
    method: req.method,
    path: req.path,
  };

  // Track response
  res.on('finish', () => {
    const latencyMs = Date.now() - startTime;
    metrics.statusCode = res.statusCode;

    // Log metrics
    if (!metricsIgnorePaths.has(metrics.path)) {
      const shouldSample = metricsSampleRate >= 1 || Math.random() < metricsSampleRate;
      if (shouldSample) {
        logger.info('Request metrics', {
          requestId,
          method: metrics.method,
          path: metrics.path,
          statusCode: metrics.statusCode,
          latencyMs,
          // Calculate p95 latency would require aggregation (use external metrics service)
        });
      }
    }

    // Track error rate
    if (metrics.statusCode && metrics.statusCode >= 400) {
      logger.warn('Request error', {
        requestId,
        method: metrics.method,
        path: metrics.path,
        statusCode: metrics.statusCode,
        latencyMs,
      });
    }
  });

  // Track errors
  res.on('error', (error: Error) => {
    metrics.error = error;
    logger.error('Request error', error, {
      requestId,
      method: metrics.method,
      path: metrics.path,
      latencyMs: Date.now() - startTime,
    });
  });

  next();
}
