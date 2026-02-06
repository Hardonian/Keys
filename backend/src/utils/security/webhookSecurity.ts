import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface WebhookEventRecord {
  id?: string;
  webhook_id: string;
  source: string;
  event_type: string;
  status: 'processing' | 'processed' | 'failed' | 'duplicate';
  received_at?: string;
  processed_at?: string;
  error_message?: string;
  result_data?: Record<string, any>;
}

export interface WebhookSecurityConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  webhookSecret: string;
  replayWindowMinutes: number;
}

export class WebhookSecurityManager {
  private supabase: SupabaseClient;
  private replayWindowMs: number;

  constructor(config: WebhookSecurityConfig) {
    if (config.supabaseUrl && config.supabaseServiceKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    } else {
      this.supabase = createClient(
        process.env.SUPABASE_URL || 'https://test.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
      );
    }
    this.replayWindowMs = config.replayWindowMinutes * 60 * 1000;
  }

  /**
   * Verify GitHub webhook signature (HMAC-SHA256)
   * Uses raw body for verification as required by GitHub
   */
  verifyGitHubSignature(rawBody: string, signature: string, secret: string): boolean {
    if (!secret) {
      console.error('[WebhookSecurity] No webhook secret configured');
      return false;
    }

    if (!signature) {
      console.error('[WebhookSecurity] No signature provided');
      return false;
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = `sha256=${hmac.update(rawBody, 'utf8').digest('hex')}`;

    try {
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch {
      console.error('[WebhookSecurity] Signature comparison failed - encoding mismatch');
      return false;
    }
  }

  /**
   * Verify GitLab webhook token (simple token comparison)
   */
  verifyGitLabToken(token: string, expectedToken: string): boolean {
    if (!expectedToken) {
      console.error('[WebhookSecurity] No GitLab token secret configured');
      return false;
    }

    if (!token) {
      console.error('[WebhookSecurity] No GitLab token provided');
      return false;
    }

    try {
      return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
    } catch {
      console.error('[WebhookSecurity] Token comparison failed');
      return false;
    }
  }

  /**
   * Verify Bitbucket webhook signature (HMAC-SHA256)
   */
  verifyBitbucketSignature(rawBody: string, signature: string, secret: string): boolean {
    if (!secret) {
      console.error('[WebhookSecurity] No Bitbucket webhook secret configured');
      return false;
    }

    if (!signature) {
      console.error('[WebhookSecurity] No Bitbucket signature provided');
      return false;
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody, 'utf8').digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch {
      console.error('[WebhookSecurity] Bitbucket signature comparison failed');
      return false;
    }
  }

  /**
   * Verify Supabase webhook signature (if configured)
   * Supabase uses JWT tokens for webhook verification
   */
  verifySupabaseWebhook(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    if (!secret) {
      console.error('[WebhookSecurity] No Supabase webhook secret configured');
      return false;
    }

    try {
      const parts = signature.split('.');
      if (parts.length !== 3) {
        console.error('[WebhookSecurity] Invalid Supabase signature format');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(parts[0] + '.' + parts[1])
        .digest('base64');

      const providedSignature = parts[2];

      const payloadBuffer = Buffer.from(parts[0] + '.' + parts[1], 'utf8');
      const expectedBuffer = Buffer.from(expectedSignature, 'base64');
      const providedBuffer = Buffer.from(providedSignature, 'base64');

      if (payloadBuffer.length !== expectedBuffer.length ||
          payloadBuffer.length !== providedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
    } catch (error) {
      console.error('[WebhookSecurity] Supabase signature verification failed:', error);
      return false;
    }
  }

  /**
   * Check idempotency - returns existing record if event was already processed
   */
  async checkIdempotency(webhookId: string, source: string): Promise<WebhookEventRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('webhook_events')
        .select('*')
        .eq('webhook_id', webhookId)
        .eq('source', source)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('[WebhookSecurity] Idempotency check failed:', error);
        throw error;
      }

      return data as WebhookEventRecord;
    } catch (error) {
      console.error('[WebhookSecurity] Database error during idempotency check:', error);
      throw error;
    }
  }

  /**
   * Record webhook event as processing (before handling)
   * Uses upsert to handle race conditions
   */
  async recordProcessing(
    webhookId: string,
    source: string,
    eventType: string
  ): Promise<{ success: boolean; isDuplicate: boolean; record: WebhookEventRecord | null }> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await this.supabase
        .from('webhook_events')
        .upsert(
          {
            webhook_id: webhookId,
            source,
            event_type: eventType,
            status: 'processing',
            received_at: now,
          },
          {
            onConflict: 'webhook_id',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) {
        if (error.message.includes('duplicate key')) {
          const existing = await this.checkIdempotency(webhookId, source);
          return {
            success: false,
            isDuplicate: true,
            record: existing,
          };
        }
        console.error('[WebhookSecurity] Failed to record processing:', error);
        throw error;
      }

      return {
        success: true,
        isDuplicate: false,
        record: data as WebhookEventRecord,
      };
    } catch (error) {
      console.error('[WebhookSecurity] Error recording processing status:', error);
      throw error;
    }
  }

  /**
   * Mark webhook event as processed successfully
   */
  async markProcessed(
    webhookId: string,
    resultData?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('webhook_events')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
          result_data: resultData,
        })
        .eq('webhook_id', webhookId);

      if (error) {
        console.error('[WebhookSecurity] Failed to mark event as processed:', error);
        throw error;
      }
    } catch (error) {
      console.error('[WebhookSecurity] Error marking event processed:', error);
      throw error;
    }
  }

  /**
   * Mark webhook event as failed
   */
  async markFailed(
    webhookId: string,
    errorMessage: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('webhook_events')
        .update({
          status: 'failed',
          processed_at: new Date().toISOString(),
          error_message: errorMessage,
        })
        .eq('webhook_id', webhookId);

      if (error) {
        console.error('[WebhookSecurity] Failed to mark event as failed:', error);
        throw error;
      }
    } catch (error) {
      console.error('[WebhookSecurity] Error marking event failed:', error);
      throw error;
    }
  }

  /**
   * Validate replay protection based on timestamp
   * Some providers include timestamps in the payload or headers
   */
  validateReplayProtection(
    eventTimestamp?: string,
    deliveredAtHeader?: string
  ): { valid: boolean; reason?: string } {
    if (!eventTimestamp && !deliveredAtHeader) {
      return { valid: true };
    }

    const timestampStr = eventTimestamp || deliveredAtHeader;
    if (!timestampStr) {
      return { valid: true };
    }

    const eventTime = new Date(timestampStr).getTime();
    const now = Date.now();

    const timeDiff = Math.abs(now - eventTime);

    if (timeDiff > this.replayWindowMs) {
      return {
        valid: false,
        reason: `Event timestamp is outside replay window (${Math.round(timeDiff / 1000 / 60)} minutes old)`,
      };
    }

    return { valid: true };
  }

  /**
   * Extract GitHub delivery ID from headers
   */
  extractGitHubDeliveryId(headers: Record<string, string>): string | null {
    return headers['x-github-delivery'] ||
           headers['X-GitHub-Delivery'] ||
           null;
  }

  /**
   * Extract GitLab event type from headers
   */
  extractGitLabEventType(headers: Record<string, string>): string | null {
    return headers['x-gitlab-event'] ||
           headers['X-Gitlab-Event'] ||
           null;
  }

  /**
   * Extract webhook ID based on source
   */
  extractWebhookId(source: string, body: any, headers: Record<string, string>): string | null {
    switch (source) {
      case 'github':
        return headers['x-github-delivery'] ||
               headers['X-GitHub-Delivery'] ||
               body?.delivery_id ||
               null;
      case 'gitlab':
        return headers['x-gitlab-event-uuid'] ||
               headers['X-Gitlab-Event-UUID'] ||
               body?.object_attributes?.id?.toString() ||
               crypto.randomUUID();
      case 'bitbucket':
        return headers['x-event-id'] ||
               headers['X-Event-Id'] ||
               body?.uuid ||
               null;
      case 'supabase':
        return body?.id ||
               body?.uid ||
               crypto.randomUUID();
      default:
        return crypto.randomUUID();
    }
  }
}

/**
 * Factory function to create WebhookSecurityManager with environment config
 */
export function createWebhookSecurityManager(): WebhookSecurityManager {
  return new WebhookSecurityManager({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
    replayWindowMinutes: parseInt(process.env.WEBHOOK_REPLAY_WINDOW_MINUTES || '5', 10),
  });
}

export const webhookSecurityManager = createWebhookSecurityManager();
