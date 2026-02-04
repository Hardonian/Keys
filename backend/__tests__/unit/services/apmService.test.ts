import { afterEach, describe, expect, it, vi } from 'vitest';
import { APMService } from '../../../src/services/apmService.js';

const flushPromises = async () =>
  new Promise<void>((resolve) => {
    setImmediate(() => resolve());
  });

describe('APMService', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('batches metrics into a single writer call', async () => {
    process.env.NODE_ENV = 'test';
    const writeMetrics = vi.fn().mockResolvedValue(undefined);
    const writeErrors = vi.fn().mockResolvedValue(undefined);
    const service = new APMService({ writeMetrics, writeErrors });
    const metric = {
      endpoint: '/health',
      method: 'GET',
      duration: 10,
      statusCode: 200,
      timestamp: new Date(),
    };

    for (let i = 0; i < 50; i += 1) {
      service.trackRequest(metric);
    }

    await flushPromises();

    expect(writeMetrics).toHaveBeenCalledTimes(1);
    expect(writeMetrics.mock.calls[0][0]).toHaveLength(50);
  });
});
