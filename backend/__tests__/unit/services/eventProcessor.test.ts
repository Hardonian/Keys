import { describe, expect, it, vi, beforeEach } from 'vitest';

type MockQueryResult = { data?: any; error?: { message: string } | null };

const mockSupabaseState = {
  fromCalls: [] as string[],
};

function createQueryBuilder(table: string) {
  const state = {
    table,
    payload: null as any,
    selectFields: null as any,
  };

  const builder = {
    select(fields?: string) {
      state.selectFields = fields ?? '*';
      return builder;
    },
    eq() {
      return builder;
    },
    order() {
      return builder;
    },
    limit() {
      return builder;
    },
    insert(payload: any): MockQueryResult & { select: () => any } {
      state.payload = payload;
      return {
        select() {
          return {
            single() {
              return { data: { id: 'run-id' }, error: null };
            },
          };
        },
      };
    },
    update() {
      return {
        eq() {
          return { data: null, error: null };
        },
      };
    },
    single(): MockQueryResult {
      if (table === 'vibe_configs') {
        return { data: { auto_suggest: true }, error: null };
      }
      if (table === 'agent_runs') {
        return { data: { id: 'run-id' }, error: null };
      }
      return { data: null, error: null };
    },
  };

  return builder;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from(table: string) {
      mockSupabaseState.fromCalls.push(table);
      return createQueryBuilder(table);
    },
  }),
}));

vi.mock('../../../src/services/promptAssembly.js', () => ({
  assemblePrompt: vi.fn(async () => ({
    systemPrompt: 'prompt',
    selectedAtomIds: ['atom-1'],
  })),
}));

vi.mock('../../../src/services/agentOrchestration.js', () => ({
  orchestrateAgent: vi.fn(async () => ({
    modelUsed: 'test-model',
    content: 'result',
    tokensUsed: 10,
    costUsd: 0.01,
  })),
}));

vi.mock('../../../src/services/notificationService.js', () => ({
  notificationService: {
    notifySuggestion: vi.fn(async () => undefined),
  },
}));

describe('processBackgroundEvent', () => {
  beforeEach(() => {
    mockSupabaseState.fromCalls = [];
  });

  it('queries vibe configs once per event', async () => {
    const { processBackgroundEvent } = await import('../../../src/services/eventProcessor.js');

    await processBackgroundEvent('user-123', {
      id: 'event-1',
      event_type: 'repo.pr.opened',
      event_data: { number: 1, title: 'Test PR' },
    });

    const vibeConfigQueries = mockSupabaseState.fromCalls.filter(
      (table) => table === 'vibe_configs'
    );
    expect(vibeConfigQueries).toHaveLength(1);
  });
});
