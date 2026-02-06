# Security Invariants: Tenant Isolation

This document defines the security invariants that enforce tenant isolation across the application. These invariants are **hard requirements** - violations indicate critical security vulnerabilities.

## Tenant Model

### Tenant Identification
- **Tenant Key**: `tenant_id` (UUID)
- **Tenant Type**: `tenant_type` (enum: `'org'` | `'user'`)
- **Resolution**: `resolveTenantContext(userId)` determines the effective tenant

### Tenant Resolution Priority
1. **Organization Membership**: If user belongs to an organization (`organization_members`), the `org_id` becomes the tenant with `tenant_type = 'org'`
2. **User-Level Fallback**: If no org membership, the `user_id` becomes the tenant with `tenant_type = 'user'`

## Security Invariants

### INV-001: Tenant Context Required
**Statement**: Every authenticated request that accesses tenant-scoped resources MUST have a validated tenant context.

**Enforcement Points**:
- `backend/src/middleware/tenantContext.ts: requireTenantMiddleware()`
- All routes accessing tenant data MUST use `requireTenantMiddleware()` after `authMiddleware`

```typescript
// CORRECT: Tenant context established
app.use('/api/protected', authMiddleware, requireTenantMiddleware(), protectedHandler);

// INCORRECT: Missing tenant context - vulnerable to cross-tenant access
app.use('/api/protected', authMiddleware, protectedHandler);
```

### INV-002: Tenant Scoping Required
**Statement**: All database queries on tenant-scoped tables MUST filter by the requesting tenant's `tenant_id` and `tenant_type`.

**Enforcement Points**:
- `backend/src/lib/tenantIsolation.ts: createTenantEnforcedQuery()`
- `backend/src/lib/tenantIsolation.ts: enforceTenantScope()`
- `backend/src/lib/tenantIsolation.ts: assertTenantAccess()`

**Tenant-Scoped Tables**:
| Table | Tenant Column | Tenant Type Column | RLS Policy |
|-------|---------------|-------------------|------------|
| `marketplace_entitlements` | `tenant_id` | `tenant_type` | ✅ |
| `marketplace_bundle_entitlements` | `tenant_id` | `tenant_type` | ✅ |
| `marketplace_download_events` | `tenant_id` | `tenant_type` | ✅ |
| `marketplace_analytics` | `tenant_id` | `tenant_type` | ✅ |
| `usage_metrics` | `user_id` | N/A | ✅ |
| `organizations` | `owner_id` | N/A | ✅ |
| `organization_members` | `org_id` | N/A | ✅ |
| `user_profiles` | `user_id` | N/A | ✅ |
| `vibe_configs` | `user_id` | N/A | ✅ |
| `agent_runs` | `user_id` | N/A | ✅ |
| `background_events` | `user_id` | N/A | ✅ |

### INV-003: RLS Database Enforcement
**Statement**: All tenant-scoped tables MUST have Row Level Security (RLS) policies that prevent cross-tenant access at the database level.

**Enforcement Points**:
- Migration files in `backend/supabase/migrations/`
- `backend/supabase/migrations/012_add_rls_core_tables.sql`
- `backend/supabase/migrations/013_add_billing_and_orgs.sql`
- `backend/supabase/migrations/016_create_marketplace_tables.sql`
- `backend/supabase/migrations/018_extend_marketplace_all_key_types.sql`
- `backend/supabase/migrations/019_add_tenant_isolation_rls.sql`

**RLS Policy Template**:
```sql
CREATE POLICY "Users can view own resources"
  ON <table_name>
  FOR SELECT
  USING (
    (tenant_type = 'user' AND tenant_id = auth.uid())
    OR
    (tenant_type = 'org' AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = <table_name>.tenant_id
      AND organization_members.user_id = auth.uid()
    ))
  );
```

### INV-004: API-Level Tenant Validation
**Statement**: API endpoints MUST validate that the requested resource belongs to the caller's tenant before returning data or performing operations.

**Enforcement Points**:
- `backend/src/routes/marketplace.ts: resolveTenantContext()` + `hasEntitlement()`
- `backend/src/routes/billing.ts: resolveTenantContext()` + entitlement checks
- `backend/src/routes/marketplace-v2.ts: resolveTenantContext()` + entitlement checks

### INV-005: No Client-Controlled Tenant ID
**Statement**: The tenant_id MUST be determined server-side from the authenticated user's session/organization membership. Client-provided tenant_ids MUST be ignored.

**Enforcement Points**:
- `backend/src/lib/marketplace/entitlements.ts: resolveTenantContext()`
- `backend/src/middleware/tenantContext.ts: resolveTenantContext()`

```typescript
// INCORRECT: Client can specify tenant_id - SECURITY VULNERABILITY
app.post('/api/resource', (req, res) => {
  const { tenantId, ...data } = req.body; // Don't trust client tenant_id
  await db.insert({ ...data, tenant_id: tenantId });
});

// CORRECT: Tenant determined server-side
app.post('/api/resource', authMiddleware, requireTenantMiddleware(), async (req, res) => {
  const tenantReq = req as TenantAuthenticatedRequest;
  await db.insert({ ...req.body, tenant_id: tenantReq.tenant.tenantId });
});
```

### INV-006: Service Role Boundary
**Statement**: Service role clients (server-side operations) MUST still respect tenant isolation when performing user-initiated operations. Service role should only bypass RLS for system-level operations (webhooks, migrations, admin functions).

**Enforcement Points**:
- RLS policies explicitly allow service_role for system operations
- Webhook handlers use service role for idempotency checks only
- Admin operations use service role for data that is explicitly system-owned

## Enforcement Architecture

### Middleware Chain
```
Request → Security Middleware → CORS → Auth Middleware → Tenant Middleware → Route Handler
```

### Data Access Pattern
```
Route Handler
  → Assert tenant context exists
  → Use tenant-scoped query helpers
  → RLS enforces at database level
  → Return tenant-scoped results
```

## Testing Requirements

### Tenant Isolation Test Suite
**Location**: `backend/__tests__/integration/tenant-isolation/`

**Test Cases**:
1. ✅ Tenant context resolution (org vs user)
2. ✅ Cross-tenant read prevention
3. ✅ Cross-tenant write prevention
4. ✅ RLS database enforcement
5. ✅ Tenant boundary validation
6. ✅ Invalid tenant rejection

### Verification Command
```bash
cd backend && npm run test:integration -- --testPathPattern="tenant-isolation"
```

## Incident Response

### Suspected Tenant Isolation Breach
1. **Immediate Actions**:
   - Check `v_tenant_isolation_status` view for RLS status
   - Review audit logs for cross-tenant access attempts
   - Identify affected tenants and notify

2. **Investigation Steps**:
   - Review code changes in `backend/src/middleware/tenantContext.ts`
   - Review code changes in `backend/src/lib/tenantIsolation.ts`
   - Check for routes missing `requireTenantMiddleware()`
   - Verify RLS policies haven't been modified

3. **Remediation**:
   - Add missing RLS policies
   - Add missing tenant middleware
   - Update tenant-scoped query helpers
   - Deploy security patch

## Compliance Checklist

- [ ] All tenant-scoped tables have RLS policies
- [ ] All routes accessing tenant data use `requireTenantMiddleware()`
- [ ] All data access uses tenant-scoped helpers
- [ ] Tenant isolation tests pass
- [ ] No routes accept client-controlled `tenant_id`
- [ ] Audit logs capture tenant isolation violations

## References

- **Migration Files**: `backend/supabase/migrations/`
- **Middleware**: `backend/src/middleware/tenantContext.ts`
- **Helpers**: `backend/src/lib/tenantIsolation.ts`
- **Tests**: `backend/__tests__/integration/tenant-isolation/`
- **Entitlements**: `backend/src/lib/marketplace/entitlements.ts`
