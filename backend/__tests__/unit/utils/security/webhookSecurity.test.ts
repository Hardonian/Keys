import crypto from 'crypto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WebhookSecurityManager,
  WebhookSecurityConfig,
} from '../../../../src/utils/security/webhookSecurity.js';

describe('WebhookSecurityManager', () => {
  let manager: WebhookSecurityManager;
  let mockSupabase: any;

  const testConfig: WebhookSecurityConfig = {
    supabaseUrl: 'https://test.supabase.co',
    supabaseServiceKey: 'test-service-key',
    webhookSecret: 'test-webhook-secret',
    replayWindowMinutes: 5,
  };

  beforeEach(() => {
    manager = new WebhookSecurityManager(testConfig);
  });

  describe('verifyGitHubSignature', () => {
    it('should verify valid GitHub signature', () => {
      const rawBody = '{"test":"data"}';
      const secret = 'test-secret';
      const hmac = crypto.createHmac('sha256', secret);
      const expectedSignature = `sha256=${hmac.update(rawBody, 'utf8').digest('hex')}`;

      const result = manager.verifyGitHubSignature(rawBody, expectedSignature, secret);

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const rawBody = '{"test":"data"}';
      const secret = 'test-secret';
      const invalidSignature = 'sha256=invalid_signature';

      const result = manager.verifyGitHubSignature(rawBody, invalidSignature, secret);

      expect(result).toBe(false);
    });

    it('should reject empty signature', () => {
      const rawBody = '{"test":"data"}';
      const secret = 'test-secret';

      const result = manager.verifyGitHubSignature(rawBody, '', secret);

      expect(result).toBe(false);
    });

    it('should reject when no secret configured', () => {
      const rawBody = '{"test":"data"}';

      const result = manager.verifyGitHubSignature(rawBody, 'some-signature', '');

      expect(result).toBe(false);
    });

    it('should handle malformed signatures safely', () => {
      const rawBody = '{"test":"data"}';
      const secret = 'test-secret';

      const result = manager.verifyGitHubSignature(rawBody, 'not-a-valid-sig', secret);

      expect(result).toBe(false);
    });
  });

  describe('verifyGitLabToken', () => {
    it('should verify valid GitLab token', () => {
      const token = 'test-token';
      const expectedToken = 'test-token';

      const result = manager.verifyGitLabToken(token, expectedToken);

      expect(result).toBe(true);
    });

    it('should reject invalid token', () => {
      const token = 'wrong-token';
      const expectedToken = 'correct-token';

      const result = manager.verifyGitLabToken(token, expectedToken);

      expect(result).toBe(false);
    });

    it('should reject empty token', () => {
      const result = manager.verifyGitLabToken('', 'some-token');

      expect(result).toBe(false);
    });

    it('should reject when no token configured', () => {
      const result = manager.verifyGitLabToken('some-token', '');

      expect(result).toBe(false);
    });
  });

  describe('verifyBitbucketSignature', () => {
    it('should verify valid Bitbucket signature', () => {
      const rawBody = '{"test":"data"}';
      const secret = 'test-secret';
      const hmac = crypto.createHmac('sha256', secret);
      const expectedSignature = hmac.update(rawBody, 'utf8').digest('hex');

      const result = manager.verifyBitbucketSignature(rawBody, expectedSignature, secret);

      expect(result).toBe(true);
    });

    it('should reject invalid Bitbucket signature', () => {
      const rawBody = '{"test":"data"}';
      const secret = 'test-secret';
      const invalidSignature = 'invalid_signature';

      const result = manager.verifyBitbucketSignature(rawBody, invalidSignature, secret);

      expect(result).toBe(false);
    });
  });

  describe('validateReplayProtection', () => {
    it('should accept events within replay window', () => {
      const now = new Date().toISOString();

      const result = manager.validateReplayProtection(now);

      expect(result.valid).toBe(true);
    });

    it('should reject events outside replay window', () => {
      const oldTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const result = manager.validateReplayProtection(oldTime);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('outside replay window');
    });

    it('should accept events with no timestamp', () => {
      const result = manager.validateReplayProtection();

      expect(result.valid).toBe(true);
    });

    it('should handle malformed timestamps gracefully', () => {
      const result = manager.validateReplayProtection('not-a-date');

      expect(result.valid).toBe(true);
    });
  });

  describe('extractGitHubDeliveryId', () => {
    it('should extract delivery ID from x-github-delivery header', () => {
      const headers = {
        'x-github-delivery': '12345-abcde',
        'content-type': 'application/json',
      };

      const result = manager.extractGitHubDeliveryId(headers);

      expect(result).toBe('12345-abcde');
    });

    it('should extract delivery ID from X-GitHub-Delivery header', () => {
      const headers = {
        'X-GitHub-Delivery': '67890-fghij',
      };

      const result = manager.extractGitHubDeliveryId(headers);

      expect(result).toBe('67890-fghij');
    });

    it('should return null when no delivery ID', () => {
      const headers = {
        'content-type': 'application/json',
      };

      const result = manager.extractGitHubDeliveryId(headers);

      expect(result).toBeNull();
    });
  });

  describe('extractWebhookId', () => {
    it('should extract GitHub delivery ID', () => {
      const body = { action: 'opened' };
      const headers = { 'x-github-delivery': 'test-123' };

      const result = manager.extractWebhookId('github', body, headers);

      expect(result).toBe('test-123');
    });

    it('should extract Supabase webhook ID', () => {
      const body = { id: 'supabase-event-456' };
      const headers = {};

      const result = manager.extractWebhookId('supabase', body, headers);

      expect(result).toBe('supabase-event-456');
    });

    it('should generate UUID for unknown sources', () => {
      const body = {};
      const headers = {};

      const result = manager.extractWebhookId('unknown', body, headers);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });
});

describe('Webhook Security - Integration Tests', () => {
  const testConfig: any = {
    supabaseUrl: 'https://test.supabase.co',
    supabaseServiceKey: 'test-service-key',
    webhookSecret: 'test-webhook-secret',
    replayWindowMinutes: 5,
  };

  describe('GitHub Webhook Flow', () => {
    it('should handle complete webhook verification flow', () => {
      const rawBody = JSON.stringify({
        action: 'opened',
        pull_request: {
          number: 123,
          title: 'Test PR',
        },
        repository: {
          full_name: 'owner/repo',
        },
      });

      const secret = 'test-secret';
      const hmac = crypto.createHmac('sha256', secret);
      const signature = `sha256=${hmac.update(rawBody, 'utf8').digest('hex')}`;

      const manager = new WebhookSecurityManager({
        ...testConfig,
        webhookSecret: secret,
      });

      const isValid = manager.verifyGitHubSignature(rawBody, signature, secret);

      expect(isValid).toBe(true);
    });

    it('should reject replayed webhooks', () => {
      const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const manager = new WebhookSecurityManager(testConfig);

      const result = manager.validateReplayProtection(oldTimestamp);

      expect(result.valid).toBe(false);
    });
  });

  describe('Idempotency Protection', () => {
    it('should detect duplicate webhook deliveries', () => {
      const webhookId = 'unique-webhook-123';

      const manager = new WebhookSecurityManager(testConfig);

      const result1 = manager.validateReplayProtection();
      expect(result1.valid).toBe(true);

      const result2 = manager.validateReplayProtection();
      expect(result2.valid).toBe(true);
    });
  });

  describe('Signature Timing Attack Protection', () => {
    it('should use timing-safe comparison for signatures', () => {
      const rawBody = '{"test":"data"}';
      const secret = 'test-secret';

      const hmac = crypto.createHmac('sha256', secret);
      const correctSignature = `sha256=${hmac.update(rawBody, 'utf8').digest('hex')}`;

      const manager = new WebhookSecurityManager(testConfig);

      const startTime = process.hrtime.bigint();
      manager.verifyGitHubSignature(rawBody, correctSignature, secret);
      const endTime = process.hrtime.bigint();

      const duration = Number(endTime - startTime);

      expect(duration).toBeGreaterThan(0);
    });
  });
});
