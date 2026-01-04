-- Add revenue tracking tables for webhook idempotency and analytics

-- Create stripe_webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'duplicate')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_event_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at ON stripe_webhook_events(processed_at);

-- Create upgrade_transactions table for upgrade audit trail
CREATE TABLE IF NOT EXISTS upgrade_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upgrade_type TEXT NOT NULL CHECK (upgrade_type IN ('key_to_bundle', 'bundle_to_subscription', 'tier_upgrade')),
  from_sku TEXT,
  to_sku TEXT NOT NULL,
  original_price INT NOT NULL,
  credits_applied INT NOT NULL DEFAULT 0,
  final_price INT NOT NULL,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upgrade_transactions_user_id ON upgrade_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_transactions_upgrade_type ON upgrade_transactions(upgrade_type);
CREATE INDEX IF NOT EXISTS idx_upgrade_transactions_created_at ON upgrade_transactions(created_at);

-- Enhance marketplace_analytics table (already exists, add missing columns if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_analytics' AND column_name = 'amount'
  ) THEN
    ALTER TABLE marketplace_analytics ADD COLUMN amount INT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketplace_analytics' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE marketplace_analytics ADD COLUMN stripe_session_id TEXT;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stripe_webhook_events (service role only)
CREATE POLICY "Service role can manage webhook events"
  ON stripe_webhook_events
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for upgrade_transactions
CREATE POLICY "Users can view own upgrade transactions"
  ON upgrade_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage upgrade transactions"
  ON upgrade_transactions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
