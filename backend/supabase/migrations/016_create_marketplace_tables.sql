-- Create marketplace tables for Notebook Pack Library hosting
-- This migration creates the data model for pack metadata, entitlements, and download tracking

-- Create marketplace_packs table
CREATE TABLE IF NOT EXISTS marketplace_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  runtime_minutes INT,
  tags JSONB DEFAULT '[]'::jsonb,
  version TEXT NOT NULL,
  license_spdx TEXT NOT NULL,
  preview_public BOOLEAN DEFAULT true,
  cover_path TEXT,
  preview_html_path TEXT,
  zip_path TEXT NOT NULL,
  sha256 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_packs_slug ON marketplace_packs(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_packs_category ON marketplace_packs(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_packs_tags ON marketplace_packs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_marketplace_packs_created_at ON marketplace_packs(created_at);

-- Create marketplace_pack_versions table (for version history)
CREATE TABLE IF NOT EXISTS marketplace_pack_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES marketplace_packs(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  zip_path TEXT NOT NULL,
  preview_html_path TEXT,
  cover_path TEXT,
  changelog_md_path TEXT,
  sha256 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pack_id, version)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_pack_versions_pack_id ON marketplace_pack_versions(pack_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_pack_versions_version ON marketplace_pack_versions(version);

-- Create marketplace_entitlements table
-- Entitlements are scoped to tenant_id (org_id) for multi-tenant support
CREATE TABLE IF NOT EXISTS marketplace_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- References organizations.id or auth.users.id
  tenant_type TEXT NOT NULL CHECK (tenant_type IN ('org', 'user')),
  pack_id UUID NOT NULL REFERENCES marketplace_packs(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('stripe', 'manual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, pack_id, tenant_type)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_entitlements_tenant_id ON marketplace_entitlements(tenant_id, tenant_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_entitlements_pack_id ON marketplace_entitlements(pack_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_entitlements_status ON marketplace_entitlements(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_entitlements_stripe_subscription_id ON marketplace_entitlements(stripe_subscription_id);

-- Create marketplace_download_events table
CREATE TABLE IF NOT EXISTS marketplace_download_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  tenant_type TEXT NOT NULL CHECK (tenant_type IN ('org', 'user')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  pack_id UUID NOT NULL REFERENCES marketplace_packs(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  ip_hash TEXT NOT NULL, -- SHA256 hash of IP address
  user_agent TEXT, -- Truncated to 500 chars
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_download_events_tenant_id ON marketplace_download_events(tenant_id, tenant_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_download_events_pack_id ON marketplace_download_events(pack_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_download_events_user_id ON marketplace_download_events(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_download_events_created_at ON marketplace_download_events(created_at);

-- Enable RLS on all marketplace tables
ALTER TABLE marketplace_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_pack_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_download_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_packs
-- Public can read pack metadata (but not sensitive paths)
CREATE POLICY "Public can view pack metadata"
  ON marketplace_packs
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete packs (via admin API)
CREATE POLICY "Service role can manage packs"
  ON marketplace_packs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for marketplace_pack_versions
CREATE POLICY "Public can view pack versions"
  ON marketplace_pack_versions
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage pack versions"
  ON marketplace_pack_versions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for marketplace_entitlements
-- Users can view entitlements for their org or themselves
CREATE POLICY "Users can view own entitlements"
  ON marketplace_entitlements
  FOR SELECT
  USING (
    -- User-level entitlements
    (tenant_type = 'user' AND tenant_id = auth.uid())
    OR
    -- Org-level entitlements (user is member of org)
    (tenant_type = 'org' AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = marketplace_entitlements.tenant_id
      AND organization_members.user_id = auth.uid()
    ))
  );

-- Service role can manage entitlements (via webhooks/admin)
CREATE POLICY "Service role can manage entitlements"
  ON marketplace_entitlements
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for marketplace_download_events
-- Users can view download events for their org or themselves
CREATE POLICY "Users can view own download events"
  ON marketplace_download_events
  FOR SELECT
  USING (
    -- User-level events
    (tenant_type = 'user' AND tenant_id = auth.uid())
    OR
    -- Org-level events (user is admin/owner of org)
    (tenant_type = 'org' AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = marketplace_download_events.tenant_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    ))
  );

-- Service role can insert download events (via download endpoint)
CREATE POLICY "Service role can insert download events"
  ON marketplace_download_events
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_packs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marketplace_packs_updated_at
  BEFORE UPDATE ON marketplace_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_packs_updated_at();

CREATE OR REPLACE FUNCTION update_marketplace_entitlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marketplace_entitlements_updated_at
  BEFORE UPDATE ON marketplace_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_entitlements_updated_at();
