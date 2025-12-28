import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retry } from '../../../src/utils/retry';

describe('Retry Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const promise = retry(fn, { maxRetries: 2, initialDelay: 100 });
    
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    const error = new Error('fail');
    const fn = vi.fn().mockRejectedValue(error);

    const promise = retry(fn, { maxRetries: 2, initialDelay: 100 });
    
    await vi.advanceTimersByTimeAsync(500);
    
    await expect(promise).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect retryable function', async () => {
    const error = new Error('not retryable');
    const fn = vi.fn().mockRejectedValue(error);

    const promise = retry(fn, {
      retryable: (err) => err.message !== 'not retryable',
    });

    await expect(promise).rejects.toThrow('not retryable');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
