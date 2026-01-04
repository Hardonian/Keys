-- Pattern 2: Multi-Tenant RLS
-- Users can only access records belonging to their tenant (organization)

-- Example: Documents table with tenant isolation
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user belongs to tenant
CREATE OR REPLACE FUNCTION user_belongs_to_tenant(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = tenant_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Users can view documents from their tenants
CREATE POLICY "Users can view tenant documents"
  ON documents
  FOR SELECT
  USING (user_belongs_to_tenant(tenant_id));

-- Policy: Users can insert documents for their tenants
CREATE POLICY "Users can insert tenant documents"
  ON documents
  FOR INSERT
  WITH CHECK (user_belongs_to_tenant(tenant_id));

-- Policy: Users can update documents from their tenants
CREATE POLICY "Users can update tenant documents"
  ON documents
  FOR UPDATE
  USING (user_belongs_to_tenant(tenant_id))
  WITH CHECK (user_belongs_to_tenant(tenant_id));

-- Policy: Users can delete documents from their tenants
CREATE POLICY "Users can delete tenant documents"
  ON documents
  FOR DELETE
  USING (user_belongs_to_tenant(tenant_id));
