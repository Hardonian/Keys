import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';

const mockProfile = { subscription_tier: 'free' };

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: mockProfile, error: null }),
        }),
      }),
    }),
  }),
}));

describe('latencyBudget', () => {
  beforeEach(() => {
    mockProfile.subscription_tier = 'free';
  });

  afterEach(() => {
    delete process.env.MARKETPLACE_REQUEST_BUDGET_MS;
    delete process.env.MARKETPLACE_REQUEST_BUDGET_MS_ENTERPRISE;
    vi.useRealTimers();
  });

  it('returns default budget when env is unset', async () => {
    const { getMarketplaceBudgetMs } = await import('../../../src/lib/marketplace/latencyBudget.js');
    expect(getMarketplaceBudgetMs()).toBeGreaterThan(0);
  });

  it('calculates remaining budget', async () => {
    const { remainingBudgetMs } = await import('../../../src/lib/marketplace/latencyBudget.js');
    const start = Date.now();
    const remaining = remainingBudgetMs(start, 100);
    expect(remaining).toBeLessThanOrEqual(100);
  });

  it('rejects when budget timeout is exceeded', async () => {
    const { withBudgetTimeout } = await import('../../../src/lib/marketplace/latencyBudget.js');
    vi.useFakeTimers();
    const promise = new Promise<void>((resolve) => setTimeout(resolve, 50));
    const wrapped = withBudgetTimeout(promise, 10, 'timed out');

    vi.advanceTimersByTime(20);
    await expect(wrapped).rejects.toThrow('timed out');
  });

  it('uses tier-specific budget overrides when available', async () => {
    const { getMarketplaceBudgetMsForUser } = await import(
      '../../../src/lib/marketplace/latencyBudget.js'
    );
    mockProfile.subscription_tier = 'enterprise';
    process.env.MARKETPLACE_REQUEST_BUDGET_MS_ENTERPRISE = '7500';

    const budget = await getMarketplaceBudgetMsForUser('user-123');
    expect(budget).toBe(7500);
  });
});
