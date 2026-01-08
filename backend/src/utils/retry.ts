/**
 * Retry utility for transient failures
 */

export interface RetryOptions {
  /**
   * Legacy option name (max retries, excluding the first attempt).
   * If provided, total attempts = maxRetries + 1.
   */
  maxRetries?: number;
  /**
   * Legacy option name (ms).
   */
  initialDelay?: number;
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryable?: (error: any) => boolean;
}

type NormalizedRetryOptions = {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryable: (error: any) => boolean;
};

const DEFAULT_OPTIONS: NormalizedRetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryable: (error: any) => {
    // Default: retry transient failures. Callers can override for stricter behavior.
    // Keeping this permissive avoids surprising "no retry" behavior for generic errors.
    void error;
    return true;
  },
};

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Support legacy option names used by existing call sites/tests.
  const legacyMaxAttempts =
    typeof options.maxRetries === 'number' && options.maxRetries >= 0
      ? options.maxRetries + 1
      : undefined;
  const legacyInitialDelayMs =
    typeof options.initialDelay === 'number' && options.initialDelay >= 0
      ? options.initialDelay
      : undefined;

  const opts: NormalizedRetryOptions = {
    maxAttempts: legacyMaxAttempts ?? options.maxAttempts ?? DEFAULT_OPTIONS.maxAttempts,
    initialDelayMs: legacyInitialDelayMs ?? options.initialDelayMs ?? DEFAULT_OPTIONS.initialDelayMs,
    maxDelayMs: options.maxDelayMs ?? DEFAULT_OPTIONS.maxDelayMs,
    backoffMultiplier: options.backoffMultiplier ?? DEFAULT_OPTIONS.backoffMultiplier,
    retryable: options.retryable ?? DEFAULT_OPTIONS.retryable,
  };
  let lastError: any;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt === opts.maxAttempts || !opts.retryable(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff (first retry waits initialDelayMs).
      const retryAfter = error.response?.headers['retry-after'];
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, waitMs));

      // Increase delay for next retry if we weren't instructed by Retry-After.
      if (!retryAfter) {
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
      } else {
        delay = opts.initialDelayMs;
      }
    }
  }

  throw lastError;
}
