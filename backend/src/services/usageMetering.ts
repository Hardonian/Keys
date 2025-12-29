import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type MetricType = 'runs' | 'tokens' | 'templates' | 'exports';

interface UsageLimit {
  runs?: number;
  tokens?: number;
  templates?: number;
  exports?: number;
}

const TIER_LIMITS: Record<string, UsageLimit> = {
  free: {
    runs: 100,
    tokens: 100000,
    templates: 10,
    exports: 5,
  },
  pro: {
    runs: 1000,
    tokens: 1000000,
    templates: 100,
    exports: 50,
  },
  enterprise: {
    runs: -1, // unlimited
    tokens: -1,
    templates: -1,
    exports: -1,
  },
};

/**
 * Track usage metric
 */
export async function trackUsage(
  userId: string,
  metricType: MetricType,
  value: number,
  idempotencyKey?: string
): Promise<void> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Use idempotency key if provided (note: idempotency_key column not yet in schema)
  // For now, use period_start as unique constraint
  const uniqueConstraint = { user_id: userId, metric_type: metricType, period_start: periodStart.toISOString() };

  const { error } = await supabase
    .from('usage_metrics')
    .upsert(
      {
        ...uniqueConstraint,
        metric_value: value,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      },
      {
        onConflict: 'user_id,metric_type,period_start',
      }
    );

  if (error) {
    console.error('Failed to track usage:', error);
    throw error;
  }
}

/**
 * Get current period usage
 */
export async function getCurrentUsage(
  userId: string,
  metricType: MetricType
): Promise<number> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data, error } = await supabase
    .from('usage_metrics')
    .select('metric_value')
    .eq('user_id', userId)
    .eq('metric_type', metricType)
    .eq('period_start', periodStart.toISOString())
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data?.metric_value || 0;
}

/**
 * Check if user has exceeded limit
 */
export async function checkLimit(
  userId: string,
  metricType: MetricType,
  additionalUsage: number = 0
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  // Get user's subscription tier
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('user_id', userId)
    .single();

  const tier = profile?.subscription_tier || 'free';
  const limit = TIER_LIMITS[tier]?.[metricType] || 0;

  // Unlimited
  if (limit === -1) {
    return {
      allowed: true,
      current: 0,
      limit: -1,
      remaining: -1,
    };
  }

  const current = await getCurrentUsage(userId, metricType);
  const total = current + additionalUsage;

  return {
    allowed: total <= limit,
    current,
    limit,
    remaining: Math.max(0, limit - total),
  };
}

/**
 * Reset monthly usage (should be called by cron job)
 */
export async function resetMonthlyUsage(): Promise<void> {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // This would typically be done via a database function or cron job
  // For now, we'll just mark old periods as expired
  const { error } = await supabase
    .from('usage_metrics')
    .delete()
    .lt('period_start', lastMonth.toISOString());

  if (error) {
    console.error('Failed to reset usage:', error);
  }
}
