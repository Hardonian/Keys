import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { orchestrateAgentRouter } from '../../../src/routes/orchestrate-agent.js';
import { authMiddleware } from '../../../src/middleware/auth.js';
import { entitlementsMiddleware } from '../../../src/middleware/entitlements.js';

// Mock dependencies
vi.mock('../../../src/services/agentOrchestration.js', () => ({
  orchestrateAgent: vi.fn().mockResolvedValue({
    content: 'Test output',
    modelUsed: 'gpt-4',
    tokensUsed: 100,
    costUsd: 0.01,
  }),
}));

vi.mock('../../../src/services/usageMetering.js', () => ({
  checkLimit: vi.fn().mockResolvedValue({
    allowed: true,
    current: 10,
    limit: 100,
    remaining: 90,
  }),
  trackUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'run-id' },
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

describe('POST /orchestrate-agent', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/orchestrate-agent', orchestrateAgentRouter);
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .post('/orchestrate-agent')
      .send({
        assembledPrompt: {
          systemPrompt: 'Test prompt',
        },
        naturalLanguageInput: 'Test input',
      });

    expect(response.status).toBe(401);
  });

  it('should require valid request body', async () => {
    const response = await request(app)
      .post('/orchestrate-agent')
      .set('Authorization', 'Bearer test-token')
      .send({});

    expect(response.status).toBe(400);
  });

  it('should check usage limits', async () => {
    const { checkLimit } = await import('../../../src/services/usageMetering.js');
    vi.mocked(checkLimit).mockResolvedValueOnce({
      allowed: false,
      current: 100,
      limit: 100,
      remaining: 0,
    });

    const response = await request(app)
      .post('/orchestrate-agent')
      .set('Authorization', 'Bearer test-token')
      .send({
        assembledPrompt: {
          systemPrompt: 'Test prompt',
        },
        naturalLanguageInput: 'Test input',
      });

    expect(response.status).toBe(429);
  });
});
