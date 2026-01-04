import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type TenantType = 'org' | 'user';

export interface EntitlementCheck {
  hasAccess: boolean;
  entitlementId?: string;
  expiresAt?: Date;
}

/**
 * Check if a tenant (org or user) has entitlement to a key
 * Server-side only - never trust client claims
 */
export async function hasEntitlement(
  tenantId: string,
  tenantType: TenantType,
  keyIdOrSlug: string
): Promise<EntitlementCheck> {
  try {
    // First, resolve key_id if slug was provided
    let keyId: string;
    if (keyIdOrSlug.length === 36 && keyIdOrSlug.includes('-')) {
      // Looks like a UUID
      keyId = keyIdOrSlug;
    } else {
      // Assume it's a slug, look it up
      const { data: key } = await supabase
        .from('marketplace_keys')
        .select('id')
        .eq('slug', keyIdOrSlug)
        .single();

      if (!key) {
        return { hasAccess: false };
      }
      keyId = key.id;
    }

    // Check for active entitlement
    const { data: entitlement, error } = await supabase
      .from('marketplace_entitlements')
      .select('id, ends_at, status')
      .eq('tenant_id', tenantId)
      .eq('tenant_type', tenantType)
      .eq('key_id', keyId)
      .eq('status', 'active')
      .single();

    if (error || !entitlement) {
      return { hasAccess: false };
    }

    // Check if entitlement has expired
    if (entitlement.ends_at) {
      const expiresAt = new Date(entitlement.ends_at);
      if (expiresAt < new Date()) {
        return { hasAccess: false };
      }
      return {
        hasAccess: true,
        entitlementId: entitlement.id,
        expiresAt,
      };
    }

    // No expiration date means permanent entitlement
    return {
      hasAccess: true,
      entitlementId: entitlement.id,
    };
  } catch (error) {
    console.error('Error checking entitlement:', error);
    // Fail closed - no access on error
    return { hasAccess: false };
  }
}

/**
 * Grant entitlement to a tenant
 */
export async function grantEntitlement(
  tenantId: string,
  tenantType: TenantType,
  keyId: string,
  source: 'stripe' | 'manual',
  options?: {
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    endsAt?: Date;
  }
): Promise<string> {
  const { data, error } = await supabase
    .from('marketplace_entitlements')
    .upsert(
      {
        tenant_id: tenantId,
        tenant_type: tenantType,
        key_id: keyId,
        source,
        status: 'active',
        stripe_subscription_id: options?.stripeSubscriptionId || null,
        stripe_price_id: options?.stripePriceId || null,
        ends_at: options?.endsAt?.toISOString() || null,
      },
      {
        onConflict: 'tenant_id,key_id,tenant_type',
      }
    )
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to grant entitlement: ${error?.message || 'Unknown error'}`);
  }

  return data.id;
}

/**
 * Revoke entitlement (set status to inactive)
 */
export async function revokeEntitlement(
  tenantId: string,
  keyId: string,
  tenantType: TenantType
): Promise<void> {
  const { error } = await supabase
    .from('marketplace_entitlements')
    .update({ status: 'inactive' })
    .eq('tenant_id', tenantId)
    .eq('tenant_type', tenantType)
    .eq('key_id', keyId);

  if (error) {
    throw new Error(`Failed to revoke entitlement: ${error.message}`);
  }
}

/**
 * Get all entitlements for a tenant
 */
export async function getTenantEntitlements(
  tenantId: string,
  tenantType: TenantType
): Promise<Array<{
  keyId: string;
  packSlug: string;
  packTitle: string;
  status: string;
  expiresAt?: Date;
}>> {
  const { data, error } = await supabase
    .from('marketplace_entitlements')
    .select(`
      key_id,
      status,
      ends_at,
      marketplace_keys!inner(id, slug, title)
    `)
    .eq('tenant_id', tenantId)
    .eq('tenant_type', tenantType)
    .eq('status', 'active');

  if (error) {
    throw new Error(`Failed to get entitlements: ${error.message}`);
  }

  return (data || []).map((ent) => ({
    keyId: ent.key_id,
    packSlug: (ent.marketplace_keys as any).slug,
    packTitle: (ent.marketplace_keys as any).title,
    status: ent.status,
    expiresAt: ent.ends_at ? new Date(ent.ends_at) : undefined,
  }));
}

/**
 * Resolve tenant context from user_id
 * Returns the primary tenant (org if user belongs to one, otherwise user)
 */
export async function resolveTenantContext(userId: string): Promise<{
  tenantId: string;
  tenantType: TenantType;
}> {
  // Check if user belongs to an org
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (orgMember) {
    return {
      tenantId: orgMember.org_id,
      tenantType: 'org',
    };
  }

  // Fall back to user-level tenant
  return {
    tenantId: userId,
    tenantType: 'user',
  };
}
