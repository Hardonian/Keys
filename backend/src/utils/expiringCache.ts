export interface ExpiringCacheOptions {
  maxAgeMs: number;
  staleWhileRevalidateMs: number;
  now?: () => number;
  onError?: (error: Error) => void;
}

export class ExpiringCache<T> {
  private cachedValue: T | null = null;
  private cachedAt: number | null = null;
  private inFlight: Promise<T> | null = null;
  private readonly now: () => number;

  constructor(
    private readonly loader: () => Promise<T>,
    private readonly options: ExpiringCacheOptions
  ) {
    this.now = options.now ?? (() => Date.now());
  }

  async get(): Promise<T> {
    const cached = this.cachedValue;
    const cachedAt = this.cachedAt;

    if (cached && cachedAt !== null) {
      const ageMs = this.now() - cachedAt;
      if (ageMs <= this.options.maxAgeMs) {
        return cached;
      }

      if (ageMs <= this.options.maxAgeMs + this.options.staleWhileRevalidateMs) {
        if (!this.inFlight) {
          void this.refresh();
        }
        return cached;
      }
    }

    return this.refresh();
  }

  set(value: T): void {
    this.cachedValue = value;
    this.cachedAt = this.now();
  }

  clear(): void {
    this.cachedValue = null;
    this.cachedAt = null;
  }

  private async refresh(): Promise<T> {
    if (this.inFlight) {
      return this.inFlight;
    }

    this.inFlight = this.loader()
      .then((value) => {
        this.set(value);
        this.inFlight = null;
        return value;
      })
      .catch((error) => {
        this.inFlight = null;
        if (this.cachedValue) {
          this.options.onError?.(error as Error);
          return this.cachedValue;
        }
        throw error;
      });

    return this.inFlight;
  }
}
