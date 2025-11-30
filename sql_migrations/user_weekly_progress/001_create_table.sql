-- Migration: Create user_weekly_progress table
-- Description: Tracks actual weekly progress against user goals (week starts Monday)
-- Created: 2024-11-30

CREATE TABLE IF NOT EXISTS user_weekly_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Goal and week identification
  goal_id TEXT NOT NULL, -- e.g., 'weekly-applications'
  week_start DATE NOT NULL, -- Monday of the week (YYYY-MM-DD)

  -- Progress tracking
  current_count INT DEFAULT 0, -- Current progress this week
  target_count INT NOT NULL, -- Snapshot of target at week start (from user_weekly_goals)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT user_weekly_progress_unique UNIQUE(user_id, goal_id, week_start)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_weekly_progress_user_week ON user_weekly_progress(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_progress_goal ON user_weekly_progress(user_id, goal_id);
CREATE INDEX IF NOT EXISTS idx_weekly_progress_week_start ON user_weekly_progress(week_start);

-- Enable Row Level Security
ALTER TABLE user_weekly_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own weekly progress"
  ON user_weekly_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly progress"
  ON user_weekly_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly progress"
  ON user_weekly_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all weekly progress"
  ON user_weekly_progress FOR ALL
  USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE TRIGGER update_user_weekly_progress_updated_at
  BEFORE UPDATE ON user_weekly_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE user_weekly_progress IS 'Weekly progress tracking against user goals (weeks start Monday)';
COMMENT ON COLUMN user_weekly_progress.goal_id IS 'The goal being tracked (matches user_weekly_goals.goal_id)';
COMMENT ON COLUMN user_weekly_progress.week_start IS 'Monday of the tracking week';
COMMENT ON COLUMN user_weekly_progress.current_count IS 'Current progress count for this week';
COMMENT ON COLUMN user_weekly_progress.target_count IS 'Target snapshot at week start (allows target changes without affecting past weeks)';
