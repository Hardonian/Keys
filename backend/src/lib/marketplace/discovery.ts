import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type DiscoverySignal = {
  signal_type: 'role' | 'tool_intent' | 'problem_category' | 'view' | 'purchase';
  signal_value: string;
  metadata?: Record<string, any>;
};

export type DiscoveryReason = {
  keyId: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
};

/**
 * Record a discovery signal for a user
 */
export async function recordDiscoverySignal(
  userId: string,
  signal: DiscoverySignal
): Promise<void> {
  // Signals expire after 90 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  const { error } = await supabase
    .from('marketplace_discovery_signals')
    .insert({
      user_id: userId,
      signal_type: signal.signal_type,
      signal_value: signal.signal_value,
      metadata: signal.metadata || {},
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    logger.error('Failed to record discovery signal:', error);
    // Don't throw - signals are non-critical
  }
}

/**
 * Get discovery signals for a user
 */
async function getUserSignals(userId: string): Promise<DiscoverySignal[]> {
  const { data, error } = await supabase
    .from('marketplace_discovery_signals')
    .select('signal_type, signal_value, metadata')
    .eq('user_id', userId)
    .is('expires_at', null)
    .or('expires_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) {
    return [];
  }

  return data.map(s => ({
    signal_type: s.signal_type as DiscoverySignal['signal_type'],
    signal_value: s.signal_value,
    metadata: s.metadata as Record<string, any> || {},
  }));
}

/**
 * Get user's owned keys
 */
async function getUserOwnedKeys(userId: string): Promise<string[]> {
  const { resolveTenantContext, getTenantEntitlements } = await import('./entitlements.js');
  const tenant = await resolveTenantContext(userId);
  const entitlements = await getTenantEntitlements(tenant.tenantId, tenant.tenantType);
  
  return entitlements.map(e => e.packSlug);
}

/**
 * Rule-based discovery engine
 * Returns recommended keys with explainable reasons
 */
export async function discoverKeys(
  userId: string,
  options?: {
    limit?: number;
    keyType?: 'jupyter' | 'node' | 'next' | 'runbook';
    excludeOwned?: boolean;
  }
): Promise<DiscoveryReason[]> {
  const limit = options?.limit || 10;
  const signals = await getUserSignals(userId);
  const ownedKeys = options?.excludeOwned ? await getUserOwnedKeys(userId) : [];

  // Build query
  let query = supabase
    .from('marketplace_keys')
    .select('id, slug, title, key_type, outcome, maturity, tags, tool, runtime');

  if (options?.keyType) {
    query = query.eq('key_type', options.keyType);
  }

  // Apply discovery rules
  const recommendations: Array<{ keyId: string; reason: string; score: number }> = [];

  // Rule 1: Tool intent matching
  const toolIntent = signals.find(s => s.signal_type === 'tool_intent');
  if (toolIntent) {
    const toolValue = toolIntent.signal_value.toLowerCase();
    
    if (toolValue.includes('cursor') || toolValue.includes('ide')) {
      // Recommend runbook keys for operational issues
      query = query.or('key_type.eq.runbook,outcome.ilike.%incident%');
    } else if (toolValue.includes('jupyter') || toolValue.includes('notebook')) {
      query = query.eq('key_type', 'jupyter');
    } else if (toolValue.includes('node') || toolValue.includes('next')) {
      query = query.in('key_type', ['node', 'next']);
    }
  }

  // Rule 2: Problem category matching
  const problemCategory = signals.find(s => s.signal_type === 'problem_category');
  if (problemCategory) {
    const category = problemCategory.signal_value.toLowerCase();
    
    if (category.includes('incident') || category.includes('debug')) {
      query = query.or('key_type.eq.runbook,outcome.ilike.%incident%');
    } else if (category.includes('build') || category.includes('monetize')) {
      query = query.in('key_type', ['node', 'next']);
    } else if (category.includes('validate') || category.includes('analysis')) {
      query = query.eq('key_type', 'jupyter');
    }
  }

  // Rule 3: Role-based recommendations
  const role = signals.find(s => s.signal_type === 'role');
  if (role) {
    const roleValue = role.signal_value.toLowerCase();
    
    if (roleValue.includes('operator') || roleValue.includes('sre')) {
      query = query.eq('key_type', 'runbook');
    } else if (roleValue.includes('developer') || roleValue.includes('engineer')) {
      query = query.in('key_type', ['node', 'next']);
    } else if (roleValue.includes('analyst') || roleValue.includes('data')) {
      query = query.eq('key_type', 'jupyter');
    }
  }

  // Execute query
  const { data: keys, error } = await query.limit(limit * 2); // Get more to filter

  if (error || !keys) {
    logger.error('Failed to discover keys:', error);
    return [];
  }

  // Score and rank recommendations
  for (const key of keys) {
    if (ownedKeys.includes(key.slug)) {
      continue; // Skip owned keys
    }

    let reason = '';
    let score = 0;

    // Score based on signals
    if (toolIntent) {
      const toolValue = toolIntent.signal_value.toLowerCase();
      if (
        (toolValue.includes('node') && (key.key_type === 'node' || key.key_type === 'next')) ||
        (toolValue.includes('jupyter') && key.key_type === 'jupyter') ||
        (toolValue.includes('cursor') && key.key_type === 'runbook')
      ) {
        reason = `Recommended because you're using ${toolIntent.signal_value}`;
        score += 10;
      }
    }

    if (problemCategory) {
      const category = problemCategory.signal_value.toLowerCase();
      if (
        (category.includes('incident') && key.key_type === 'runbook') ||
        (category.includes('build') && (key.key_type === 'node' || key.key_type === 'next')) ||
        (category.includes('validate') && key.key_type === 'jupyter')
      ) {
        reason = reason || `Recommended for ${problemCategory.signal_value}`;
        score += 8;
      }
    }

    if (role) {
      const roleValue = role.signal_value.toLowerCase();
      if (
        (roleValue.includes('operator') && key.key_type === 'runbook') ||
        (roleValue.includes('developer') && (key.key_type === 'node' || key.key_type === 'next')) ||
        (roleValue.includes('analyst') && key.key_type === 'jupyter')
      ) {
        reason = reason || `Recommended for ${role.signal_value}`;
        score += 6;
      }
    }

    // Boost starter/operator maturity for new users
    if (key.maturity === 'starter' || key.maturity === 'operator') {
      score += 3;
    }

    // Default reason if none set
    if (!reason) {
      reason = `Popular ${key.key_type} key`;
      score = 1;
    }

    recommendations.push({
      keyId: key.id,
      reason,
      score,
    });
  }

  // Sort by score and return top N
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations.slice(0, limit).map(r => ({
    keyId: r.keyId,
    reason: r.reason,
    confidence: r.score >= 10 ? 'high' : r.score >= 5 ? 'medium' : 'low',
  }));
}

/**
 * Get related keys for a given key
 */
export async function getRelatedKeys(
  keySlug: string,
  limit: number = 5
): Promise<Array<{ id: string; slug: string; title: string; reason: string }>> {
  // Get the key
  const { data: key } = await supabase
    .from('marketplace_keys')
    .select('id, slug, title, outcome, tags, key_type')
    .eq('slug', keySlug)
    .single();

  if (!key) {
    return [];
  }

  // Find related keys by outcome, tags, or key_type
  let query = supabase
    .from('marketplace_keys')
    .select('id, slug, title')
    .neq('slug', keySlug)
    .limit(limit * 2);

  // Prioritize same outcome
  if (key.outcome) {
    query = query.eq('outcome', key.outcome);
  }

  const { data: related } = await query;

  if (!related) {
    return [];
  }

  return related.slice(0, limit).map(k => ({
    id: k.id,
    slug: k.slug,
    title: k.title,
    reason: key.outcome ? `Similar outcome: ${key.outcome}` : `Related ${key.key_type} key`,
  }));
}
