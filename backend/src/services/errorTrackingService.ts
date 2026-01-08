import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { apmService } from './apmService.js';

let supabaseClient: SupabaseClient<any> | null = null;

function getSupabaseAdminClient() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if ((!url || !key) && process.env.NODE_ENV === 'test') {
    supabaseClient = createClient<any>(url || 'http://127.0.0.1:54321', key || 'test-service-role') as SupabaseClient<any>;
    return supabaseClient;
  }

  if (!url || !key) {
    throw new Error('Supabase admin client is not configured');
  }

  supabaseClient = createClient<any>(url, key) as SupabaseClient<any>;
  return supabaseClient;
}

export interface ErrorGroup {
  errorType: string;
  errorMessage: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  affectedUsers: number;
  stackTrace?: string;
}

export interface ErrorBudget {
  errorRate: number;
  threshold: number;
  period: 'hour' | 'day' | 'week';
  status: 'healthy' | 'warning' | 'exceeded';
}

export class ErrorTrackingService {
  /**
   * Group errors by fingerprint
   */
  private getErrorFingerprint(error: {
    errorType: string;
    errorMessage: string;
    stackTrace?: string;
  }): string {
    // Create fingerprint from error type, message, and first few lines of stack
    const stackLines = error.stackTrace?.split('\n').slice(0, 3).join('\n') || '';
    return `${error.errorType}:${error.errorMessage}:${stackLines}`.substring(0, 200);
  }

  /**
   * Track and group error
   */
  async trackError(error: {
    errorType: string;
    errorMessage: string;
    endpoint?: string;
    userId?: string;
    stackTrace?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // Track via APM
    apmService.trackError({
      errorType: error.errorType,
      errorMessage: error.errorMessage,
      endpoint: error.endpoint,
      userId: error.userId,
      stackTrace: error.stackTrace,
      timestamp: new Date(),
      metadata: error.metadata,
    });

    // Store in database for grouping
    const fingerprint = this.getErrorFingerprint(error);
    
    try {
      await getSupabaseAdminClient().from('background_events').insert({
        event_type: 'error.tracked',
        source: 'error_tracking',
        event_data: {
          ...error,
          fingerprint,
        },
        event_timestamp: new Date().toISOString(),
        user_id: error.userId || 'system',
      });
    } catch (err) {
      console.error('Error tracking failed:', err);
    }
  }

  /**
   * Get error groups (deduplicated errors)
   */
  async getErrorGroups(hours: number = 24): Promise<ErrorGroup[]> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    try {
      const { data: events } = await getSupabaseAdminClient()
        .from('background_events')
        .select('*')
        .eq('event_type', 'error.tracked')
        .gte('event_timestamp', startTime.toISOString())
        .order('event_timestamp', { ascending: false })
        .limit(1000);

      if (!events || events.length === 0) {
        return [];
      }

      // Group by fingerprint
      const groups = new Map<string, ErrorGroup>();

      events.forEach((event) => {
        const eventData = event.event_data as any;
        const fingerprint = eventData.fingerprint || 'unknown';

        if (!groups.has(fingerprint)) {
          groups.set(fingerprint, {
            errorType: eventData.errorType || 'Unknown',
            errorMessage: eventData.errorMessage || 'Unknown error',
            count: 0,
            firstSeen: new Date(event.event_timestamp),
            lastSeen: new Date(event.event_timestamp),
            affectedUsers: new Set<string>().size,
            stackTrace: eventData.stackTrace,
          });
        }

        const group = groups.get(fingerprint)!;
        group.count++;
        group.lastSeen = new Date(
          Math.max(
            group.lastSeen.getTime(),
            new Date(event.event_timestamp).getTime()
          )
        );
      });

      return Array.from(groups.values()).sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error getting error groups:', error);
      return [];
    }
  }

  /**
   * Check error budget
   */
  async checkErrorBudget(period: 'hour' | 'day' | 'week' = 'hour'): Promise<ErrorBudget> {
    const hours = period === 'hour' ? 1 : period === 'day' ? 24 : 168;
    const stats = await apmService.getErrorStats(hours);
    
    // Get total requests in same period (would need to track this)
    // For now, estimate based on error rate
    const estimatedRequests = stats.total * 100; // Assume 1% error rate
    const errorRate = estimatedRequests > 0 ? (stats.total / estimatedRequests) * 100 : 0;
    
    // Error budget: 1% error rate threshold
    const threshold = 1.0;
    let status: 'healthy' | 'warning' | 'exceeded' = 'healthy';
    
    if (errorRate > threshold) {
      status = 'exceeded';
    } else if (errorRate > threshold * 0.8) {
      status = 'warning';
    }

    return {
      errorRate,
      threshold,
      period,
      status,
    };
  }
}

export const errorTrackingService = new ErrorTrackingService();
