import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler, notFoundHandler } from '../../../src/middleware/errorHandler.js';

const testUserId = 'test-user-123';

// Mock auth to behave like an authenticated request in integration tests.
vi.mock('../../../src/middleware/auth.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.userId = testUserId;
    req.user = { id: testUserId, role: 'admin' };
    next();
  },
  optionalAuthMiddleware: (_req: any, _res: any, next: any) => next(),
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock Supabase client used by the router (no network).
type ProfileRow = { id: string; user_id: string; name?: string; role?: string; vertical?: string };
const profiles = new Map<string, ProfileRow>();

vi.mock('@supabase/supabase-js', () => {
  const mockSupabase = {
    from: (_table: string) => ({
      select: (_cols?: any, _opts?: any) => ({
        eq: (_col: string, userId: string) => ({
          single: async () => {
            const row = profiles.get(userId);
            if (!row) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
            return { data: row, error: null };
          },
        }),
        range: () => ({
          order: async () => ({ data: Array.from(profiles.values()), error: null, count: profiles.size }),
        }),
        order: () => ({
          order: async () => ({ data: Array.from(profiles.values()), error: null, count: profiles.size }),
        }),
      }),
      insert: (row: any) => ({
        select: () => ({
          single: async () => {
            const id = `prof_${Math.random().toString(36).slice(2, 10)}`;
            const full = { id, ...row } as ProfileRow;
            profiles.set(full.user_id, full);
            return { data: full, error: null };
          },
        }),
      }),
      update: (updates: any) => ({
        eq: (_col: string, userId: string) => ({
          select: () => ({
            single: async () => {
              const existing = profiles.get(userId);
              if (!existing) return { data: null, error: { code: 'PGRST116', message: 'Not found' } };
              const next = { ...existing, ...updates } as ProfileRow;
              profiles.set(userId, next);
              return { data: next, error: null };
            },
          }),
        }),
      }),
    }),
    auth: {
      getUser: async () => ({ data: { user: { id: testUserId, email: 'test@example.com', user_metadata: { role: 'admin' } } }, error: null }),
    },
  };
  return { createClient: vi.fn(() => mockSupabase) };
});

let app: express.Application;

describe('Profiles API Integration Tests', () => {
  beforeAll(async () => {
    const { profilesRouter } = await import('../../../src/routes/profiles.js');
    app = express();
    app.use(express.json());
    app.use('/profiles', profilesRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  it('should create a profile', async () => {
    const response = await request(app)
      .post('/profiles')
      .send({
        user_id: testUserId,
        name: 'Test User',
        role: 'founder',
        vertical: 'software',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.user_id).toBe(testUserId);
    expect(response.body.name).toBe('Test User');
  });

  it('should get a profile', async () => {
    const response = await request(app)
      .get(`/profiles/${testUserId}`)
      .expect(200);

    expect(response.body.user_id).toBe(testUserId);
  });

  it('should update a profile', async () => {
    const response = await request(app)
      .patch(`/profiles/${testUserId}`)
      .send({
        name: 'Updated Name',
      })
      .expect(200);

    expect(response.body.name).toBe('Updated Name');
  });

  it('should return 404 for non-existent profile', async () => {
    await request(app)
      .get('/profiles/non-existent')
      .expect(404);
  });

  it('should validate input', async () => {
    const response = await request(app)
      .post('/profiles')
      .send({
        role: 'invalid-role',
      })
      .expect(400);

    expect(response.body.error).toHaveProperty('code');
  });
});
