import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ErrorMetric {
  errorType: string;
  errorMessage: string;
  endpoint?: string;
  userId?: string;
  stackTrace?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class APMService {
  private metricsBuffer: PerformanceMetric[] = [];
  private errorsBuffer: ErrorMetric[] = [];
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL = 10000; // 10 seconds

  constructor() {
    // Flush metrics periodically
    setInterval(() => this.flushMetrics(), this.FLUSH_INTERVAL);
    setInterval(() => this.flushErrors(), this.FLUSH_INTERVAL);
  }

  /**
   * Track request performance
   */
  trackRequest(metric: PerformanceMetric): void {
    this.metricsBuffer.push(metric);

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.BATCH_SIZE) {
      this.flushMetrics();
    }
  }

  /**
   * Track error
   */
  trackError(error: ErrorMetric): void {
    this.errorsBuffer.push(error);

    // Flush if buffer is full
    if (this.errorsBuffer.length >= this.BATCH_SIZE) {
      this.flushErrors();
    }
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(
    endpoint?: string,
    hours: number = 24
  ): Promise<{
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    count: number;
    errorRate: number;
  }> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    try {
      // Query from agent_runs table (using trigger_data for metrics)
      // In production, you'd have a dedicated metrics table
      const { data: runs } = await supabase
        .from('agent_runs')
        .select('created_at, trigger_data, cost_usd')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      const metrics = (runs || [])
        .map((run) => {
          const triggerData = run.trigger_data as any;
          return triggerData?.duration || 0;
        })
        .filter((d) => d > 0);

      if (metrics.length === 0) {
        return {
          p50: 0,
          p95: 0,
          p99: 0,
          avg: 0,
          count: 0,
          errorRate: 0,
        };
      }

      const sorted = metrics.sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;

      return {
        p50,
        p95,
        p99,
        avg,
        count: sorted.length,
        errorRate: 0, // Would calculate from error metrics
      };
    } catch (error) {
      console.error('Error getting performance stats:', error);
      return {
        p50: 0,
        p95: 0,
        p99: 0,
        avg: 0,
        count: 0,
        errorRate: 0,
      };
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(hours: number = 24): Promise<{
    total: number;
    byType: Record<string, number>;
    recent: ErrorMetric[];
  }> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    // In production, query from error_logs table
    // For now, return current buffer stats
    const recent = this.errorsBuffer.filter(
      (e) => e.timestamp >= startTime
    );

    const byType: Record<string, number> = {};
    recent.forEach((error) => {
      byType[error.errorType] = (byType[error.errorType] || 0) + 1;
    });

    return {
      total: recent.length,
      byType,
      recent: recent.slice(0, 100), // Last 100 errors
    };
  }

  /**
   * Flush metrics buffer to database
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const toFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      // In production, insert into metrics table
      // For now, we'll log or store in a way that doesn't break the app
      console.log(`[APM] Flushing ${toFlush.length} performance metrics`);
      
      // Could store in background_events table with event_type='apm.metric'
      for (const metric of toFlush) {
        await supabase.from('background_events').insert({
          event_type: 'apm.metric',
          source: 'apm',
          event_data: metric,
          event_timestamp: metric.timestamp.toISOString(),
          user_id: metric.userId || 'system',
        });
      }
    } catch (error) {
      console.error('Error flushing metrics:', error);
      // Don't throw - APM failures shouldn't break the app
    }
  }

  /**
   * Flush errors buffer to database
   */
  private async flushErrors(): Promise<void> {
    if (this.errorsBuffer.length === 0) return;

    const toFlush = [...this.errorsBuffer];
    this.errorsBuffer = [];

    try {
      console.log(`[APM] Flushing ${toFlush.length} error metrics`);
      
      for (const error of toFlush) {
        await supabase.from('background_events').insert({
          event_type: 'apm.error',
          source: 'apm',
          event_data: error,
          event_timestamp: error.timestamp.toISOString(),
          user_id: error.userId || 'system',
        });
      }
    } catch (error) {
      console.error('Error flushing errors:', error);
    }
  }
}

export const apmService = new APMService();
