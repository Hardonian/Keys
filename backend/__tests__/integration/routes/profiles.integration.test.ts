import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { profilesRouter } from '../../../src/routes/profiles.js';
import { errorHandler, notFoundHandler } from '../../../src/middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/profiles', profilesRouter);
app.use(notFoundHandler);
app.use(errorHandler);

describe('Profiles API Integration Tests', () => {
  const testUserId = 'test-user-123';

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
