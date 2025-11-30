-- Migration: Create goal_events table
-- Description: Event log for goal tracking - enables ML, analytics, and data recovery
-- Created: 2024-11-30

CREATE TABLE IF NOT EXISTS goal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL, -- 'baseline_completed', 'weekly_increment', 'weekly_reset', 'goal_enabled', 'goal_disabled'
  goal_id TEXT NOT NULL, -- The goal this event relates to

  -- Flexible metadata for additional context
  metadata JSONB DEFAULT '{}'::JSONB, -- e.g., { job_application_id, contact_id, source }

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_goal_events_user ON goal_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goal_events_type ON goal_events(user_id, goal_id, event_type);
CREATE INDEX IF NOT EXISTS idx_goal_events_goal ON goal_events(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_events_created ON goal_events(created_at DESC);

-- Enable Row Level Security
ALTER TABLE goal_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own goal events"
  ON goal_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goal events"
  ON goal_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: No UPDATE policy - events are immutable (append-only log)

CREATE POLICY "Service role can manage all goal events"
  ON goal_events FOR ALL
  USING (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE goal_events IS 'Immutable event log for goal tracking - used for ML, analytics, and data recovery';
COMMENT ON COLUMN goal_events.event_type IS 'Type of event: baseline_completed, weekly_increment, weekly_reset, goal_enabled, goal_disabled';
COMMENT ON COLUMN goal_events.goal_id IS 'The goal this event relates to (action_id or weekly goal_id)';
COMMENT ON COLUMN goal_events.metadata IS 'Flexible JSON metadata (e.g., related entity IDs, source info)';
