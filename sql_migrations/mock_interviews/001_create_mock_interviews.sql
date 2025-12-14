-- Mock interviews table for Beyond Presence AI video interviews
-- This migration was applied via Supabase MCP on 2024-12-13

CREATE TABLE mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bey_call_id TEXT, -- Beyond Presence call ID (populated by webhook)
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  transcript JSONB, -- Full messages array from webhook
  evaluation JSONB, -- Evaluation object from webhook
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX idx_mock_interviews_user_id ON mock_interviews(user_id);

-- Index for webhook lookups by call ID
CREATE INDEX idx_mock_interviews_bey_call_id ON mock_interviews(bey_call_id);

-- Enable RLS
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;

-- Users can view their own mock interviews
CREATE POLICY "Users can view own mock interviews" ON mock_interviews
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own mock interviews
CREATE POLICY "Users can insert own mock interviews" ON mock_interviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own mock interviews (for status changes from client)
CREATE POLICY "Users can update own mock interviews" ON mock_interviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_mock_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mock_interviews_updated_at
  BEFORE UPDATE ON mock_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_mock_interviews_updated_at();
