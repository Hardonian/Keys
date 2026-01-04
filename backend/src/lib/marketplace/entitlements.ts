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
 * Check if a tenant (org or user) has entitlement to a pack
 * Server-side only - never trust client claims
 */
export async function hasEntitlement(
  tenantId: string,
  tenantType: TenantType,
  packIdOrSlug: string
): Promise<EntitlementCheck> {
  try {
    // First, resolve pack_id if slug was provided
    let packId: string;
    if (packIdOrSlug.length === 36 && packIdOrSlug.includes('-')) {
      // Looks like a UUID
      packId = packIdOrSlug;
    } else {
      // Assume it's a slug, look it up
      const { data: pack } = await supabase
        .from('marketplace_packs')
        .select('id')
        .eq('slug', packIdOrSlug)
        .single();

      if (!pack) {
        return { hasAccess: false };
      }
      packId = pack.id;
    }

    // Check for active entitlement
    const { data: entitlement, error } = await supabase
      .from('marketplace_entitlements')
      .select('id, ends_at, status')
      .eq('tenant_id', tenantId)
      .eq('tenant_type', tenantType)
      .eq('pack_id', packId)
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
  packId: string,
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
        pack_id: packId,
        source,
        status: 'active',
        stripe_subscription_id: options?.stripeSubscriptionId || null,
        stripe_price_id: options?.stripePriceId || null,
        ends_at: options?.endsAt?.toISOString() || null,
      },
      {
        onConflict: 'tenant_id,pack_id,tenant_type',
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
  packId: string,
  tenantType: TenantType
): Promise<void> {
  const { error } = await supabase
    .from('marketplace_entitlements')
    .update({ status: 'inactive' })
    .eq('tenant_id', tenantId)
    .eq('tenant_type', tenantType)
    .eq('pack_id', packId);

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
  packId: string;
  packSlug: string;
  packTitle: string;
  status: string;
  expiresAt?: Date;
}>> {
  const { data, error } = await supabase
    .from('marketplace_entitlements')
    .select(`
      pack_id,
      status,
      ends_at,
      marketplace_packs!inner(id, slug, title)
    `)
    .eq('tenant_id', tenantId)
    .eq('tenant_type', tenantType)
    .eq('status', 'active');

  if (error) {
    throw new Error(`Failed to get entitlements: ${error.message}`);
  }

  return (data || []).map((ent) => ({
    packId: ent.pack_id,
    packSlug: (ent.marketplace_packs as any).slug,
    packTitle: (ent.marketplace_packs as any).title,
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
