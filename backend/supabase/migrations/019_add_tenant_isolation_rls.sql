-- Tenant Isolation RLS Policies
-- This migration ensures comprehensive tenant isolation for all tenant-scoped tables

-- Verify RLS is enabled on all tenant-scoped tables
DO $$
DECLARE
    table_name TEXT;
    rls_enabled BOOLEAN;
BEGIN
    FOR table_name IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'tenant_id'
        AND table_schema = 'public'
        AND table_name NOT LIKE 'auth.%'
        AND table_name NOT LIKE 'pg_%'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'Enabled RLS on table: %', table_name;
    END LOOP;
END $$;

-- Create function to check if user is member of organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE org_id = is_org_member.org_id
        AND user_id = is_org_member.user_id
    );
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin/owner of organization
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE org_id = is_org_admin.org_id
        AND user_id = is_org_admin.user_id
        AND role IN ('owner', 'admin')
    );
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for marketplace_entitlements (already exists but ensuring consistency)
-- Already has proper policies from migration 016 and 018

-- RLS for marketplace_bundle_entitlements (already exists)
-- Already has proper policies from migration 018

-- RLS for marketplace_download_events (already exists)
-- Already has proper policies from migration 016

-- RLS for marketplace_analytics (already exists)
-- Already has proper policies from migration 018

-- RLS for usage_metrics (already exists)
-- Already has proper policies from migration 013

-- RLS for user_profiles (already exists)
-- Already has proper policies from migration 012

-- RLS for vibe_configs (already exists)
-- Already has proper policies from migration 012

-- RLS for agent_runs (already exists)
-- Already has proper policies from migration 012

-- RLS for background_events (already exists)
-- Already has proper policies from migration 012

-- RLS for organizations (already exists)
-- Already has proper policies from migration 013

-- RLS for organization_members (already exists)
-- Already has proper policies from migration 013

-- RLS for invitations (already exists)
-- Already has proper policies from migration 013

-- Create policy for stripe_webhook_events - only service role access
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY IF NOT EXISTS;

DROP POLICY IF EXISTS "Service role can manage webhook events" ON stripe_webhook_events;
CREATE POLICY "Service role can manage webhook events"
    ON stripe_webhook_events
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Create policy for marketplace_download_events INSERT verification
-- This ensures that the tenant_id in the insert matches the authenticated user's tenant
DROP POLICY IF EXISTS "Tenant-scoped download events insert" ON marketplace_download_events;
CREATE POLICY "Tenant-scoped download events insert"
    ON marketplace_download_events
    FOR INSERT
    WITH CHECK (
        -- User-level events must match user_id
        (tenant_type = 'user' AND tenant_id = auth.uid())
        OR
        -- Org-level events require membership
        (tenant_type = 'org' AND is_org_member(tenant_id, auth.uid()))
    );

-- Create view for tenant isolation verification
CREATE OR REPLACE VIEW v_tenant_isolation_status AS
SELECT
    table_name,
    column_name,
    rls_enabled,
    (
        SELECT COUNT(*) > 0
        FROM pg_policies
        WHERE tablename = table_name
        AND policyschema = 'public'
    ) AS has_policies
FROM (
    SELECT DISTINCT
        c.table_name,
        'tenant_id' AS column_name
    FROM information_schema.columns c
    WHERE c.column_name = 'tenant_id'
    AND c.table_schema = 'public'
    AND c.table_name NOT LIKE 'auth.%'
    AND c.table_name NOT LIKE 'pg_%'
) tables;

-- Grant access to the view
GRANT SELECT ON v_tenant_isolation_status TO service_role;
GRANT SELECT ON v_tenant_isolation_status TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW v_tenant_isolation_status IS 'View to verify tenant isolation RLS policies are in place';
