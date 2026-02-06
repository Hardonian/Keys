-- Webhook Idempotency and Security Table
-- Provides replay protection, duplicate detection, and audit trail for all webhooks

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'processed' CHECK (status IN ('processing', 'processed', 'failed', 'duplicate')),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  result_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at DESC);

-- Function to cleanup old webhook events (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_events WHERE received_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_events (service role only - internal use)
CREATE POLICY "Service role can manage webhook events"
  ON webhook_events
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE webhook_events IS 'Stores webhook events for idempotency, replay protection, and audit trail. Webhook_id is the unique identifier from the provider (e.g., Stripe event.id, GitHub delivery-id).';
COMMENT ON COLUMN webhook_events.webhook_id IS 'Unique webhook event ID from the provider (Stripe: event.id, GitHub: X-GitHub-Delivery header)';
COMMENT ON COLUMN webhook_events.source IS 'Webhook source: stripe, github, gitlab, bitbucket, supabase';
COMMENT ON COLUMN webhook_events.status IS 'Processing status: processing, processed, failed, duplicate';
COMMENT ON COLUMN webhook_events.received_at IS 'When the webhook was first received';
