import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TenantContext, TenantType } from '../middleware/tenantContext.js';
import { logger } from '../utils/logger.js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type { TenantContext, TenantType };

export { supabaseAdmin };

export interface TenantScopedQueryOptions {
  requireTenant?: boolean;
}

const DEFAULT_OPTIONS: TenantScopedQueryOptions = {
  requireTenant: true,
};

export function createTenantScopedClient(
  tenant: TenantContext,
  client?: SupabaseClient
): SupabaseClient {
  return client || supabaseAdmin;
}

export interface TenantEnforcedQuery<T = any> {
  query: any;
  tenant: TenantContext;
}

export function enforceTenantScope(
  query: any,
  tenant: TenantContext,
  tenantColumn: string,
  tenantTypeColumn?: string
): any {
  let scopedQuery = query.eq(tenantColumn, tenant.tenantId);

  if (tenantTypeColumn) {
    scopedQuery = scopedQuery.eq(tenantTypeColumn, tenant.tenantType);
  }

  return scopedQuery;
}

export function assertTenantAccess(
  resourceType: string,
  resourceId: string | undefined,
  tenant: TenantContext
): void {
  if (!tenant?.tenantId) {
    throw new Error(
      `TENANT ISOLATION VIOLATION: Attempted to access ${resourceType} without tenant context. ` +
      `Resource ID: ${resourceId}. This indicates a missing requireTenantMiddleware call.`
    );
  }

  logger.debug('Tenant access verified', {
    resourceType,
    resourceId,
    tenantId: tenant.tenantId,
    tenantType: tenant.tenantType,
  });
}

export function createTenantEnforcedQuery(
  client: SupabaseClient,
  table: string,
  tenant: TenantContext,
  tenantColumn: string = 'tenant_id',
  tenantTypeColumn: string = 'tenant_type'
): any {
  assertTenantAccess(table, undefined, tenant);

  let query = client
    .from(table)
    .select('*')
    .eq(tenantColumn, tenant.tenantId);

  if (tenantTypeColumn) {
    query = query.eq(tenantTypeColumn, tenant.tenantType);
  }

  return query;
}

export async function tenantScopedInsert(
  client: SupabaseClient,
  table: string,
  tenant: TenantContext,
  data: Record<string, any>,
  tenantColumn: string = 'tenant_id',
  tenantTypeColumn: string = 'tenant_type'
): Promise<any> {
  assertTenantAccess(table, undefined, tenant);

  const dataWithTenant = {
    ...data,
    [tenantColumn]: tenant.tenantId,
    [tenantTypeColumn]: tenant.tenantType,
  };

  const { data: result, error } = await client
    .from(table)
    .insert(dataWithTenant)
    .select()
    .single();

  if (error) {
    logger.error('Tenant-scoped insert failed', error as Error, {
      table,
      tenantId: tenant.tenantId,
      tenantType: tenant.tenantType,
    });
    throw new Error(`Failed to insert ${table}: ${(error as Error).message}`);
  }

  return result;
}

export async function tenantScopedUpdate(
  client: SupabaseClient,
  table: string,
  tenant: TenantContext,
  filters: Record<string, any>,
  updates: Record<string, any>,
  tenantColumn: string = 'tenant_id',
  tenantTypeColumn: string = 'tenant_type'
): Promise<any | null> {
  assertTenantAccess(table, undefined, tenant);

  let query = client
    .from(table)
    .update(updates)
    .eq(tenantColumn, tenant.tenantId);

  if (tenantTypeColumn) {
    query = query.eq(tenantTypeColumn, tenant.tenantType);
  }

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query.select().single();

  if (error) {
    logger.error('Tenant-scoped update failed', error as Error, {
      table,
      tenantId: tenant.tenantId,
      tenantType: tenant.tenantType,
      filters,
    });
    throw new Error(`Failed to update ${table}: ${(error as Error).message}`);
  }

  return data;
}

export async function tenantScopedUpsert(
  client: SupabaseClient,
  table: string,
  tenant: TenantContext,
  data: Record<string, any>,
  conflictColumns: string[],
  tenantColumn: string = 'tenant_id',
  tenantTypeColumn: string = 'tenant_type'
): Promise<any> {
  assertTenantAccess(table, undefined, tenant);

  const dataWithTenant = {
    ...data,
    [tenantColumn]: tenant.tenantId,
    [tenantTypeColumn]: tenant.tenantType,
  };

  const { data: result, error } = await client
    .from(table)
    .upsert(dataWithTenant, { onConflict: [...conflictColumns, tenantColumn, tenantTypeColumn].join(',') })
    .select()
    .single();

  if (error) {
    logger.error('Tenant-scoped upsert failed', error as Error, {
      table,
      tenantId: tenant.tenantId,
      tenantType: tenant.tenantType,
    });
    throw new Error(`Failed to upsert ${table}: ${(error as Error).message}`);
  }

  return result;
}

export async function tenantScopedDelete(
  client: SupabaseClient,
  table: string,
  tenant: TenantContext,
  filters: Record<string, any>,
  tenantColumn: string = 'tenant_id',
  tenantTypeColumn: string = 'tenant_type'
): Promise<boolean> {
  assertTenantAccess(table, undefined, tenant);

  let query = client
    .from(table)
    .delete()
    .eq(tenantColumn, tenant.tenantId);

  if (tenantTypeColumn) {
    query = query.eq(tenantTypeColumn, tenant.tenantType);
  }

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { error } = await query;

  if (error) {
    logger.error('Tenant-scoped delete failed', error as Error, {
      table,
      tenantId: tenant.tenantId,
      tenantType: tenant.tenantType,
    });
    throw new Error(`Failed to delete from ${table}: ${(error as Error).message}`);
  }

  return true;
}

export function verifyTenantIsolation(
  accessedTenantId: string,
  requestTenantId: string
): boolean {
  if (accessedTenantId !== requestTenantId) {
    logger.warn('TENANT ISOLATION VIOLATION ATTEMPT', {
      accessedTenantId,
      requestTenantId,
      timestamp: new Date().toISOString(),
    });
    return false;
  }
  return true;
}
