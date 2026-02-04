import { describe, expect, it, vi } from 'vitest';
import { ExpiringCache } from '../../../src/utils/expiringCache.js';

const flushPromises = async () =>
  new Promise<void>((resolve) => {
    setImmediate(() => resolve());
  });

describe('ExpiringCache', () => {
  it('returns cached value within max age', async () => {
    let now = 0;
    const loader = vi.fn(async () => ({ value: 'fresh' }));
    const cache = new ExpiringCache(loader, {
      maxAgeMs: 1000,
      staleWhileRevalidateMs: 1000,
      now: () => now,
    });

    const first = await cache.get();
    expect(first.value).toBe('fresh');
    expect(loader).toHaveBeenCalledTimes(1);

    now = 500;
    const second = await cache.get();
    expect(second.value).toBe('fresh');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('serves stale while revalidating', async () => {
    let now = 0;
    let value = { value: 'v1' };
    const loader = vi.fn(async () => value);
    const cache = new ExpiringCache(loader, {
      maxAgeMs: 1000,
      staleWhileRevalidateMs: 2000,
      now: () => now,
    });

    const first = await cache.get();
    expect(first.value).toBe('v1');

    now = 1500;
    value = { value: 'v2' };
    const stale = await cache.get();
    expect(stale.value).toBe('v1');

    await flushPromises();
    const refreshed = await cache.get();
    expect(refreshed.value).toBe('v2');
  });

  it('deduplicates concurrent refreshes', async () => {
    let resolveLoader: (value: { value: string }) => void;
    const loader = vi.fn(
      () =>
        new Promise<{ value: string }>((resolve) => {
          resolveLoader = resolve;
        })
    );

    const cache = new ExpiringCache(loader, {
      maxAgeMs: 0,
      staleWhileRevalidateMs: 0,
    });

    const pendingA = cache.get();
    const pendingB = cache.get();

    resolveLoader!({ value: 'shared' });
    const [resultA, resultB] = await Promise.all([pendingA, pendingB]);

    expect(resultA.value).toBe('shared');
    expect(resultB.value).toBe('shared');
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
