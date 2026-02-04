#!/usr/bin/env tsx
import { EventEmitter } from 'events';
import { metricsMiddleware } from '../src/middleware/metrics.js';
import { requestLoggingMiddleware } from '../src/middleware/security.js';
import { logger } from '../src/utils/logger.js';

class MockResponse extends EventEmitter {
  statusCode = 200;
  setHeader() {
    return undefined;
  }
}

async function run(): Promise<void> {
  const iterations = 1000;
  let infoCount = 0;
  let warnCount = 0;
  let errorCount = 0;

  logger.info = ((message: string, context?: Record<string, unknown>) => {
    infoCount += 1;
    return undefined;
  }) as typeof logger.info;

  logger.warn = ((message: string, context?: Record<string, unknown>) => {
    warnCount += 1;
    return undefined;
  }) as typeof logger.warn;

  logger.error = ((message: string, error?: Error, context?: Record<string, unknown>) => {
    errorCount += 1;
    return undefined;
  }) as typeof logger.error;

  for (let i = 0; i < iterations; i += 1) {
    const req = {
      method: 'GET',
      url: '/health',
      path: '/health',
      headers: { 'x-request-id': `bench-${i}` },
    } as any;
    const res = new MockResponse() as any;

    metricsMiddleware(req, res, () => undefined);
    requestLoggingMiddleware(req, res, () => undefined);

    res.emit('finish');
  }

  console.log('Request logging benchmark');
  console.log(`Iterations: ${iterations}`);
  console.log(`info logs: ${infoCount}`);
  console.log(`warn logs: ${warnCount}`);
  console.log(`error logs: ${errorCount}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
