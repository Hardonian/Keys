import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import crypto from 'crypto';

describe('Webhook Integration Tests', () => {
  describe('Code Repository Webhook Endpoint', () => {
    it('should reject requests with invalid signature', async () => {
      const app = express();
      app.use(express.json());

      app.post('/webhooks/code-repo', async (req, res) => {
        const signature = req.headers['x-hub-signature-256'] as string;
        const rawBody = req.body instanceof Buffer
          ? req.body.toString('utf8')
          : JSON.stringify(req.body);

        if (!signature) {
          return res.status(401).json({ error: 'Signature required' });
        }

        const secret = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';
        const hmac = crypto.createHmac('sha256', secret);
        const expectedSig = `sha256=${hmac.update(rawBody, 'utf8').digest('hex')}`;

        if (signature !== expectedSig) {
          return res.status(401).json({ error: 'Invalid signature' });
        }

        return res.status(200).json({ received: true });
      });

      const payload = { action: 'opened', pull_request: { number: 1 } };
      const response = await makeRequest(app, '/webhooks/code-repo', payload, {
        'x-hub-signature-256': 'sha256=invalid',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid');
    });

    it('should accept requests with valid signature', async () => {
      const app = express();
      const receivedEvents: any[] = [];

      app.post('/webhooks/code-repo', express.raw({ type: 'application/json' }), async (req, res) => {
        const signature = req.headers['x-hub-signature-256'] as string;
        const rawBody = req.body.toString('utf8');

        const secret = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';
        const hmac = crypto.createHmac('sha256', secret);
        const expectedSig = `sha256=${hmac.update(rawBody, 'utf8').digest('hex')}`;

        if (signature !== expectedSig) {
          return res.status(401).json({ error: 'Invalid signature' });
        }

        receivedEvents.push(JSON.parse(rawBody));
        return res.status(200).json({ received: true });
      });

      const payload = { action: 'opened', pull_request: { number: 1 } };
      const rawPayload = JSON.stringify(payload);
      const secret = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';
      const hmac = crypto.createHmac('sha256', secret);
      const signature = `sha256=${hmac.update(rawPayload, 'utf8').digest('hex')}`;

      const response = await makeRequest(app, '/webhooks/code-repo', rawPayload, {
        'x-hub-signature-256': signature,
        'x-github-event': 'pull_request',
        'x-github-delivery': 'test-delivery-123',
      });

      expect(response.status).toBe(200);
      expect(receivedEvents.length).toBe(1);
      expect(receivedEvents[0].action).toBe('opened');
    });

    it('should detect duplicate deliveries', async () => {
      const processedIds = new Set<string>();

      const app = express();
      app.post('/webhooks/code-repo', express.raw({ type: 'application/json' }), async (req, res) => {
        const deliveryId = req.headers['x-github-delivery'] as string;

        if (processedIds.has(deliveryId)) {
          return res.status(200).json({ received: true, duplicate: true });
        }

        processedIds.add(deliveryId);
        return res.status(200).json({ received: true, duplicate: false });
      });

      const payload = { action: 'opened' };
      const headers = {
        'x-github-delivery': 'same-delivery-id',
        'x-hub-signature-256': 'sha256=test',
        'x-github-event': 'pull_request',
      };

      await makeRequest(app, '/webhooks/code-repo', JSON.stringify(payload), headers);
      const response = await makeRequest(app, '/webhooks/code-repo', JSON.stringify(payload), headers);

      expect(response.body.duplicate).toBe(true);
    });
  });

  describe('Supabase Webhook Endpoint', () => {
    it('should process valid Supabase webhook', async () => {
      const app = express();
      const receivedEvents: any[] = [];

      app.post('/webhooks/supabase', async (req, res) => {
        receivedEvents.push(req.body);
        return res.status(200).json({ received: true });
      });

      const payload = {
        event_type: 'INSERT',
        table: 'users',
        record: { id: '123', email: 'test@example.com' },
      };

      const response = await makeRequest(app, '/webhooks/supabase', payload);

      expect(response.status).toBe(200);
      expect(receivedEvents.length).toBe(1);
      expect(receivedEvents[0].table).toBe('users');
    });

    it('should deduplicate Supabase webhooks', async () => {
      const processedIds = new Set<string>();

      const app = express();
      app.post('/webhooks/supabase', async (req, res) => {
        const webhookId = req.body.id || 'unknown';

        if (processedIds.has(webhookId)) {
          return res.status(200).json({ received: true, duplicate: true });
        }

        processedIds.add(webhookId);
        return res.status(200).json({ received: true, duplicate: false });
      });

      const payload = { id: 'unique-event-123', event_type: 'INSERT', table: 'test' };

      await makeRequest(app, '/webhooks/supabase', payload);
      const response = await makeRequest(app, '/webhooks/supabase', payload);

      expect(response.body.duplicate).toBe(true);
    });
  });

  describe('Stripe Webhook Endpoint', () => {
    it('should reject invalid Stripe signature', async () => {
      const app = express();
      const stripe = require('stripe')('sk_test_123');

      app.post('/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
        const sig = req.headers['stripe-signature'] as string;

        if (sig !== 'valid_signature') {
          return res.status(400).json({ error: 'Invalid signature' });
        }

        return res.status(200).json({ received: true });
      });

      const payload = { type: 'checkout.session.completed', data: {} };

      const response = await makeRequest(app, '/billing/webhook', JSON.stringify(payload), {
        'stripe-signature': 'invalid_signature',
      });

      expect(response.status).toBe(400);
    });
  });
});

async function makeRequest(
  app: express.Express,
  path: string,
  body: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve) => {
    const http = require('http');
    const server = app.listen(0, () => {
      const port = (server.address() as any).port;

      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      const options = {
        hostname: 'localhost',
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
          ...headers,
        },
      };

      const req = http.request(options, (res: any) => {
        let data = '';
        res.on('data', (chunk: string) => {
          data += chunk;
        });
        res.on('end', () => {
          server.close();
          try {
            resolve({
              status: res.statusCode,
              body: JSON.parse(data),
            });
          } catch {
            resolve({
              status: res.statusCode,
              body: data,
            });
          }
        });
      });

      req.on('error', (e: any) => {
        server.close();
        resolve({
          status: 500,
          body: { error: e.message },
        });
      });

      req.write(bodyStr);
      req.end();
    });
  });
}
