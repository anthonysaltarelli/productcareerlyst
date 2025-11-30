-- Migration: Create user_weekly_goals table
-- Description: Stores user-confirmed weekly goal targets from onboarding
-- Created: 2024-11-30

CREATE TABLE IF NOT EXISTS user_weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Goal identification
  goal_id TEXT NOT NULL, -- e.g., 'weekly-applications', 'weekly-networking-calls'
  label TEXT NOT NULL, -- Display label for the goal

  -- User-configured targets
  target_count INT NOT NULL, -- User-confirmed target per week
  is_enabled BOOLEAN DEFAULT TRUE, -- User can disable goals they don't want to track

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT user_weekly_goals_unique UNIQUE(user_id, goal_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_weekly_goals_user ON user_weekly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_weekly_goals_enabled ON user_weekly_goals(user_id, is_enabled);

-- Enable Row Level Security
ALTER TABLE user_weekly_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own weekly goals"
  ON user_weekly_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly goals"
  ON user_weekly_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly goals"
  ON user_weekly_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all weekly goals"
  ON user_weekly_goals FOR ALL
  USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE TRIGGER update_user_weekly_goals_updated_at
  BEFORE UPDATE ON user_weekly_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE user_weekly_goals IS 'User-configured weekly goal targets from onboarding confirmation';
COMMENT ON COLUMN user_weekly_goals.goal_id IS 'Predefined goal identifier (e.g., weekly-applications)';
COMMENT ON COLUMN user_weekly_goals.label IS 'Human-readable label for the goal';
COMMENT ON COLUMN user_weekly_goals.target_count IS 'Target count per week confirmed by user';
COMMENT ON COLUMN user_weekly_goals.is_enabled IS 'Whether user wants to track this goal';
