# Migration 020: Extend Marketplace for New Tool Types

**IMPORTANT**: Run this SQL in Supabase SQL Editor before running ingestion.

## Instructions

1. Go to: **Supabase Dashboard → SQL Editor**
2. Click **New Query**
3. Copy and paste the SQL below
4. Click **Run** (or press Cmd/Ctrl + Enter)

---

## SQL to Execute

```sql
-- Extend marketplace to support new tool types: Stripe, GitHub, Supabase, Cursor
-- Migration: 020_extend_marketplace_new_tool_types.sql
-- Purpose: Add support for Stripe Keys, GitHub Keys, Supabase Keys, Cursor Keys

-- Step 1: Add unified 'tool' column if it doesn't exist as a general classifier
-- (Currently 'tool' only exists for node/next keys, we need it for all keys)

-- First, ensure 'tool' column exists and is nullable (for existing keys)
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
-- For jupyter/runbook keys, tool = key_type
-- For node/next keys, tool already exists
UPDATE marketplace_keys
SET tool = key_type
WHERE tool IS NULL AND key_type IN ('jupyter', 'runbook');

-- Step 3: Extend 'key_type' constraint to include new tool-specific types
-- Drop the old constraint
ALTER TABLE marketplace_keys DROP CONSTRAINT IF EXISTS marketplace_keys_key_type_check;

-- Add new constraint that allows all key types
ALTER TABLE marketplace_keys
ADD CONSTRAINT marketplace_keys_key_type_check
CHECK (
  key_type IN (
    'jupyter', 'node', 'next', 'runbook',
    'workflow', 'template', 'prompt', 'composer'
  )
);

-- Step 4: Extend 'tool' constraint to include new tools
ALTER TABLE marketplace_keys DROP CONSTRAINT IF EXISTS marketplace_keys_tool_check;

ALTER TABLE marketplace_keys
ADD CONSTRAINT marketplace_keys_tool_check
CHECK (
  tool IN (
    'jupyter', 'node', 'next', 'runbook',
    'stripe', 'github', 'supabase', 'cursor'
  )
);

-- Step 5: Make 'tool' NOT NULL after migration
-- First ensure all existing keys have tool set
UPDATE marketplace_keys
SET tool = COALESCE(tool, key_type)
WHERE tool IS NULL;

-- Now make it NOT NULL
ALTER TABLE marketplace_keys
ALTER COLUMN tool SET NOT NULL;

-- Step 6: Add indexes for new tool types
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_tool ON marketplace_keys(tool);
CREATE INDEX IF NOT EXISTS idx_marketplace_keys_tool_key_type ON marketplace_keys(tool, key_type);

-- Step 7: Add Stripe-specific fields
DO $$
BEGIN
  -- Add webhook_event_types for Stripe keys
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_keys' AND column_name = 'webhook_event_types'
  ) THEN
    ALTER TABLE marketplace_keys ADD COLUMN webhook_event_types JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add stripe_integration_level for Stripe keys
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

-- Step 11: Update RLS policies to work with new tool types
-- (No changes needed - existing policies are tool-agnostic)

-- Step 12: Add comment documenting the schema
COMMENT ON COLUMN marketplace_keys.tool IS 'Primary tool classifier: jupyter, node, next, runbook, stripe, github, supabase, cursor';
COMMENT ON COLUMN marketplace_keys.key_type IS 'Tool-specific key type: workflow, template, prompt, composer, or tool name for legacy keys';
```

---

## Verification

After running the migration, verify it worked:

```sql
-- Check tool column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'marketplace_keys' AND column_name = 'tool';

-- Check new columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'marketplace_keys'
AND column_name IN (
  'webhook_event_types',
  'stripe_integration_level',
  'github_workflow_type',
  'github_template_type',
  'supabase_feature_type',
  'cursor_prompt_type'
);
```

---

## Next Steps

After migration is complete, run:

```bash
cd backend
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
npx tsx scripts/deploy-roadmap.ts
```
