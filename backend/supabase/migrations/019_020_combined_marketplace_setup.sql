-- Combined Migration: Create marketplace_keys table (018) + Extend for new tool types (020)
-- Run this if marketplace_keys table doesn't exist yet

-- Part 1: Create marketplace_keys table (from migration 018)
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_slug ON marketplace_keys(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_key_type ON marketplace_keys(key_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_category ON marketplace_keys(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_tags ON marketplace_keys USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_outcome ON marketplace_keys(outcome);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_maturity ON marketplace_keys(maturity);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_stripe_product_id ON marketplace_keys(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_created_at ON marketplace_keys(created_at);

-- Create marketplace_key_versions table
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

-- Part 2: Extend for new tool types (from migration 020)
-- Step 1: Add unified 'tool' column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_keys' AND column_name = 'tool'
  ) THEN
    ALTER TABLE marketplace_keys ADD COLUMN tool TEXT;
  END IF;
END $$;

-- Step 2: Migrate existing keys to set 'tool' based on 'key_type'
UPDATE marketplace_keys
SET tool = key_type
WHERE tool IS NULL AND key_type IN ('jupyter', 'runbook');

-- Step 3: Extend 'key_type' constraint
ALTER TABLE marketplace_keys DROP CONSTRAINT IF EXISTS marketplace_keys_key_type_check;

ALTER TABLE marketplace_keys
ADD CONSTRAINT marketplace_keys_key_type_check
CHECK (
  key_type IN (
    'jupyter', 'node', 'next', 'runbook',
    'workflow', 'template', 'prompt', 'composer'
  )
);

-- Step 4: Extend 'tool' constraint
ALTER TABLE marketplace_keys DROP CONSTRAINT IF EXISTS marketplace_keys_tool_check;

ALTER TABLE marketplace_keys
ADD CONSTRAINT marketplace_keys_tool_check
CHECK (
  tool IN (
    'jupyter', 'node', 'next', 'runbook',
    'stripe', 'github', 'supabase', 'cursor'
  )
);

-- Step 5: Make 'tool' NOT NULL
UPDATE marketplace_keys
SET tool = COALESCE(tool, key_type)
WHERE tool IS NULL;

ALTER TABLE marketplace_keys
ALTER COLUMN tool SET NOT NULL;

-- Step 6: Add indexes for new tool types
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_tool ON marketplace_keys(tool);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_tool_key_type ON marketplace_keys(tool, key_type);

-- Step 7: Add Stripe-specific fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_keys' AND column_name = 'webhook_event_types'
  ) THEN
    ALTER TABLE marketplace_keys ADD COLUMN webhook_event_types JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_keys' AND column_name = 'stripe_integration_level'
  ) THEN
    ALTER TABLE marketplace_keys ADD COLUMN stripe_integration_level TEXT 
      CHECK (stripe_integration_level IN ('basic', 'advanced', 'enterprise'));
  END IF;
END $$;

-- Step 8: Add GitHub-specific fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_keys' AND column_name = 'github_workflow_type'
  ) THEN
    ALTER TABLE marketplace_keys ADD COLUMN github_workflow_type TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_keys' AND column_name = 'github_template_type'
  ) THEN
    ALTER TABLE marketplace_keys ADD COLUMN github_template_type TEXT;
  END IF;
END $$;

-- Step 9: Add Supabase-specific fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_keys' AND column_name = 'supabase_feature_type'
  ) THEN
    ALTER TABLE marketplace_keys ADD COLUMN supabase_feature_type TEXT;
  END IF;
END $$;

-- Step 10: Add Cursor-specific fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_keys' AND column_name = 'cursor_prompt_type'
  ) THEN
    ALTER TABLE marketplace_keys ADD COLUMN cursor_prompt_type TEXT;
  END IF;
END $$;

-- Step 11: Add comments
COMMENT ON COLUMN marketplace_keys.tool IS 'Primary tool classifier: jupyter, node, next, runbook, stripe, github, supabase, cursor';
COMMENT ON COLUMN marketplace_keys.key_type IS 'Tool-specific key type: workflow, template, prompt, composer, or tool name for legacy keys';

-- Enable RLS (if not already enabled)
ALTER TABLE marketplace_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_key_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (if not exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marketplace_keys' AND policyname = 'Public can view key metadata'
  ) THEN
    CREATE POLICY "Public can view key metadata"
      ON marketplace_keys
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marketplace_keys' AND policyname = 'Service role can manage keys'
  ) THEN
    CREATE POLICY "Service role can manage keys"
      ON marketplace_keys
      FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;
