-- Migration: Create webhook_events table
-- Description: Stores incoming Stripe webhook events for debugging and audit purposes
-- Created: 2025-01-27

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe event identifiers
  stripe_event_id TEXT UNIQUE NOT NULL,
  stripe_event_type TEXT NOT NULL,
  
  -- Event data
  payload JSONB NOT NULL,
  
  -- Processing status
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  
  -- Timestamps
  stripe_created_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Request metadata
  stripe_signature TEXT,
  ip_address TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_type ON webhook_events(stripe_event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_created_at ON webhook_events(stripe_created_at DESC);

-- Enable Row Level Security
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only service role can access webhook events (no user access)
CREATE POLICY "Service role can manage all webhook events"
  ON webhook_events FOR ALL
  USING (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE webhook_events IS 'Stores incoming Stripe webhook events for debugging and audit';
COMMENT ON COLUMN webhook_events.stripe_event_id IS 'Unique Stripe event ID (evt_xxx)';
COMMENT ON COLUMN webhook_events.stripe_event_type IS 'Event type like checkout.session.completed';
COMMENT ON COLUMN webhook_events.payload IS 'Full JSON payload from Stripe';
COMMENT ON COLUMN webhook_events.processed IS 'Whether the event was successfully processed';
COMMENT ON COLUMN webhook_events.processing_error IS 'Error message if processing failed';
COMMENT ON COLUMN webhook_events.stripe_created_at IS 'When Stripe created the event';
COMMENT ON COLUMN webhook_events.received_at IS 'When we received the webhook';
COMMENT ON COLUMN webhook_events.processed_at IS 'When we finished processing';

