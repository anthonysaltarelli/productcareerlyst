-- Migration: Create user_baseline_actions table
-- Description: Tracks one-time "Get Started" setup actions from the personalized plan
-- Created: 2024-11-30

CREATE TABLE IF NOT EXISTS user_baseline_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Action identification
  action_id TEXT NOT NULL, -- e.g., 'portfolio-create', 'resume-import', 'course-pm-fundamentals'
  label TEXT NOT NULL, -- Display label for the action
  section_title TEXT NOT NULL, -- Which section this action belongs to

  -- Completion tracking
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_source TEXT, -- 'manual' | 'auto' (how it was marked complete)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT user_baseline_actions_unique UNIQUE(user_id, action_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_baseline_actions_user ON user_baseline_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_baseline_actions_completion ON user_baseline_actions(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_user_baseline_actions_action_id ON user_baseline_actions(action_id);

-- Enable Row Level Security
ALTER TABLE user_baseline_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own baseline actions"
  ON user_baseline_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own baseline actions"
  ON user_baseline_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baseline actions"
  ON user_baseline_actions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all baseline actions"
  ON user_baseline_actions FOR ALL
  USING (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE user_baseline_actions IS 'One-time setup actions from the personalized career plan';
COMMENT ON COLUMN user_baseline_actions.action_id IS 'Predefined action identifier (e.g., portfolio-create, resume-import)';
COMMENT ON COLUMN user_baseline_actions.label IS 'Human-readable display label for the action';
COMMENT ON COLUMN user_baseline_actions.section_title IS 'Section grouping for display (e.g., Stand Out with a Product Portfolio)';
COMMENT ON COLUMN user_baseline_actions.is_completed IS 'Whether the action has been completed';
COMMENT ON COLUMN user_baseline_actions.completed_at IS 'When the action was marked complete';
COMMENT ON COLUMN user_baseline_actions.completed_source IS 'How the action was completed: manual (user clicked) or auto (system detected)';
