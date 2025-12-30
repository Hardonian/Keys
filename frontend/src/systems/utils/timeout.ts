/**
 * Timeout Utilities
 * 
 * Utilities for handling timeouts in async operations.
 */

export interface TimeoutOptions {
  timeout?: number;
  onTimeout?: () => void;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Wrap an async operation with a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, onTimeout } = options;

  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        onTimeout?.();
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);
    }),
  ]);
}

/**
 * Create a timeout promise that rejects after specified time
 */
export function createTimeout(timeout: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout after ${timeout}ms`));
    }, timeout);
  });
}
