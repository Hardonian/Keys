-- Extend marketplace to support all KEY types (node/next keys, runbook keys, jupyter keys)
-- This migration extends the existing pack-focused schema to a unified keys model

-- Create unified marketplace_keys table (replaces marketplace_packs concept)
CREATE TABLE IF NOT EXISTS marketplace_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  key_type TEXT NOT NULL CHECK (key_type IN ('jupyter', 'node', 'next', 'runbook')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Common metadata
  version TEXT NOT NULL,
  license_spdx TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  outcome TEXT,
  maturity TEXT CHECK (maturity IN ('starter', 'operator', 'scale', 'enterprise')),
  
  -- Jupyter-specific fields
  category TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  runtime_minutes INT,
  preview_public BOOLEAN DEFAULT true,
  
  -- Node/Next-specific fields
  tool TEXT CHECK (tool IN ('node', 'next')),
  runtime TEXT CHECK (runtime IN ('node', 'next')),
  key_types JSONB, -- Array of types: ["route", "job", "data", "ui", "integration"]
  
  -- Runbook-specific fields
  severity_level TEXT CHECK (severity_level IN ('p0', 'p1', 'p2', 'p3', 'p4')),
  runtime_dependency TEXT CHECK (runtime_dependency IN ('assisted', 'automated')),
  required_access_level TEXT CHECK (required_access_level IN ('read', 'write', 'admin')),
  produces_evidence BOOLEAN,
  compliance_relevance JSONB DEFAULT '[]'::jsonb,
  
  -- Asset paths
  cover_path TEXT,
  preview_html_path TEXT,
  zip_path TEXT,
  changelog_md_path TEXT,
  sha256 TEXT,
  
  -- Stripe product/price IDs
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  
  -- Pricing
  price_cents INT, -- Price in cents (null for free)
  is_bundle BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_keys_slug ON marketplace_keys(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_key_type ON marketplace_keys(key_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_category ON marketplace_keys(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_tags ON marketplace_keys USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_outcome ON marketplace_keys(outcome);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_maturity ON marketplace_keys(maturity);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_stripe_product_id ON marketplace_keys(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_created_at ON marketplace_keys(created_at);

-- Create marketplace_key_versions table (for version history)
CREATE TABLE IF NOT EXISTS marketplace_key_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL REFERENCES marketplace_keys(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  zip_path TEXT,
  preview_html_path TEXT,
  cover_path TEXT,
  changelog_md_path TEXT,
  sha256 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key_id, version)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_key_versions_key_id ON marketplace_key_versions(key_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_key_versions_version ON marketplace_key_versions(version);

-- Update marketplace_entitlements to reference marketplace_keys
ALTER TABLE marketplace_entitlements 
  DROP CONSTRAINT IF EXISTS marketplace_entitlements_pack_id_fkey;

ALTER TABLE marketplace_entitlements
  RENAME COLUMN pack_id TO key_id;

ALTER TABLE marketplace_entitlements
  ADD CONSTRAINT marketplace_entitlements_key_id_fkey
  FOREIGN KEY (key_id) REFERENCES marketplace_keys(id) ON DELETE CASCADE;

-- Update marketplace_download_events to reference marketplace_keys
ALTER TABLE marketplace_download_events
  DROP CONSTRAINT IF EXISTS marketplace_download_events_pack_id_fkey;

ALTER TABLE marketplace_download_events
  RENAME COLUMN pack_id TO key_id;

ALTER TABLE marketplace_download_events
  ADD CONSTRAINT marketplace_download_events_key_id_fkey
  FOREIGN KEY (key_id) REFERENCES marketplace_keys(id) ON DELETE CASCADE;

-- Create marketplace_bundles table
CREATE TABLE IF NOT EXISTS marketplace_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  bundle_type TEXT NOT NULL CHECK (bundle_type IN ('starter', 'operator', 'pro')),
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  price_cents INT NOT NULL,
  key_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of key IDs included in bundle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_bundles_slug ON marketplace_bundles(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_bundles_bundle_type ON marketplace_bundles(bundle_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_bundles_stripe_product_id ON marketplace_bundles(stripe_product_id);

-- Create marketplace_bundle_entitlements table
CREATE TABLE IF NOT EXISTS marketplace_bundle_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  tenant_type TEXT NOT NULL CHECK (tenant_type IN ('org', 'user')),
  bundle_id UUID NOT NULL REFERENCES marketplace_bundles(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('stripe', 'manual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, bundle_id, tenant_type)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_bundle_entitlements_tenant_id ON marketplace_bundle_entitlements(tenant_id, tenant_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_bundle_entitlements_bundle_id ON marketplace_bundle_entitlements(bundle_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_bundle_entitlements_status ON marketplace_bundle_entitlements(status);

-- Create marketplace_analytics table
CREATE TABLE IF NOT EXISTS marketplace_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'discovery_click', 'purchase', 'download', 'bundle_upgrade')),
  key_id UUID REFERENCES marketplace_keys(id) ON DELETE SET NULL,
  bundle_id UUID REFERENCES marketplace_bundles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID,
  tenant_type TEXT CHECK (tenant_type IN ('org', 'user')),
  discovery_reason TEXT, -- Why this key was recommended
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_analytics_event_type ON marketplace_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_analytics_key_id ON marketplace_analytics(key_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_analytics_bundle_id ON marketplace_analytics(bundle_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_analytics_user_id ON marketplace_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_analytics_created_at ON marketplace_analytics(created_at);

-- Create marketplace_discovery_signals table (privacy-respecting user signals)
CREATE TABLE IF NOT EXISTS marketplace_discovery_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('role', 'tool_intent', 'problem_category', 'view', 'purchase')),
  signal_value TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Auto-expire old signals
);

CREATE INDEX IF NOT EXISTS idx_marketplace_discovery_signals_user_id ON marketplace_discovery_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_discovery_signals_signal_type ON marketplace_discovery_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_discovery_signals_expires_at ON marketplace_discovery_signals(expires_at);

-- Enable RLS on new tables
ALTER TABLE marketplace_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_key_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_bundle_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_discovery_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_keys
CREATE POLICY "Public can view key metadata"
  ON marketplace_keys
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage keys"
  ON marketplace_keys
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for marketplace_key_versions
CREATE POLICY "Public can view key versions"
  ON marketplace_key_versions
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage key versions"
  ON marketplace_key_versions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for marketplace_bundles
CREATE POLICY "Public can view bundles"
  ON marketplace_bundles
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage bundles"
  ON marketplace_bundles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for marketplace_bundle_entitlements
CREATE POLICY "Users can view own bundle entitlements"
  ON marketplace_bundle_entitlements
  FOR SELECT
  USING (
    (tenant_type = 'user' AND tenant_id = auth.uid())
    OR
    (tenant_type = 'org' AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = marketplace_bundle_entitlements.tenant_id
      AND organization_members.user_id = auth.uid()
    ))
  );

CREATE POLICY "Service role can manage bundle entitlements"
  ON marketplace_bundle_entitlements
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for marketplace_analytics
CREATE POLICY "Service role can insert analytics"
  ON marketplace_analytics
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view own analytics"
  ON marketplace_analytics
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    (tenant_type = 'org' AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = marketplace_analytics.tenant_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    ))
  );

-- RLS Policies for marketplace_discovery_signals
CREATE POLICY "Users can manage own signals"
  ON marketplace_discovery_signals
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage signals"
  ON marketplace_discovery_signals
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marketplace_keys_updated_at
  BEFORE UPDATE ON marketplace_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_keys_updated_at();

CREATE OR REPLACE FUNCTION update_marketplace_bundles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marketplace_bundles_updated_at
  BEFORE UPDATE ON marketplace_bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_bundles_updated_at();

-- Function to clean up expired discovery signals
CREATE OR REPLACE FUNCTION cleanup_expired_discovery_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM marketplace_discovery_signals
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
