import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const codeRepoAdapterMock = {
  getRecentPullRequests: vi.fn(),
  isPRStale: vi.fn(async () => false),
  checkBuildStatus: vi.fn(async () => null),
};

const supabaseAdapterMock = {
  detectSchemaChanges: vi.fn(async () => []),
  schemaChangeToEventType: vi.fn(() => 'supabase.schema.changed'),
  checkPendingMigrations: vi.fn(async () => false),
};

vi.mock('../../../src/integrations/codeRepoAdapter.js', () => ({
  codeRepoAdapter: codeRepoAdapterMock,
}));

vi.mock('../../../src/integrations/supabaseAdapter.js', () => ({
  supabaseAdapter: supabaseAdapterMock,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                single: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
    }),
  }),
}));

describe('BackgroundEventLoop backoff integration', () => {
  beforeEach(() => {
    codeRepoAdapterMock.getRecentPullRequests.mockReset();
    codeRepoAdapterMock.getRecentPullRequests.mockResolvedValue([]);
    supabaseAdapterMock.detectSchemaChanges.mockReset();
    supabaseAdapterMock.detectSchemaChanges.mockRejectedValue(new Error('API down'));
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('backs off after polling failures and retries after the backoff window', async () => {
    const { BackgroundEventLoop } = await import('../../../src/services/backgroundEventLoop.js');
    const loop = new BackgroundEventLoop();

    await (loop as any).pollExternalEvents('user-123');
    expect(supabaseAdapterMock.detectSchemaChanges).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2024-01-01T00:00:02Z'));
    await (loop as any).pollExternalEvents('user-123');
    expect(supabaseAdapterMock.detectSchemaChanges).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2024-01-01T00:00:06Z'));
    await (loop as any).pollExternalEvents('user-123');
    expect(supabaseAdapterMock.detectSchemaChanges).toHaveBeenCalledTimes(2);
  });
});
