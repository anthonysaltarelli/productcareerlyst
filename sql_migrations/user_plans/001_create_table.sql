-- Migration: Create user_plans table
-- Description: Stores AI-generated personalized career plans for users
-- Created: 2024-11-30

CREATE TABLE IF NOT EXISTS user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Plan metadata
  plan_version INT DEFAULT 1, -- Increment if user regenerates plan

  -- User context snapshot (for reference/debugging)
  onboarding_snapshot JSONB NOT NULL, -- Copy of onboarding data used to generate

  -- The personalized plan content
  summary TEXT NOT NULL, -- AI-generated summary paragraph
  baseline_actions JSONB NOT NULL, -- Array of ActionSection objects:
  -- [{ title: string, description: string, actions: [{ id: string, label: string }] }]

  weekly_goals_description TEXT NOT NULL, -- "Land The Offer" section description

  -- Target timeline
  target_role TEXT, -- e.g., 'Senior Product Manager'
  target_date DATE, -- Calculated from timeline selection
  timeline_selection TEXT, -- '1_month', '3_months', '6_months', '1_year'

  -- Completion tracking
  baseline_all_complete BOOLEAN DEFAULT FALSE, -- Set true when all baseline actions done
  baseline_completed_at TIMESTAMP WITH TIME ZONE, -- When baseline was completed

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT user_plans_user_id_unique UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_plans_user ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_baseline_complete ON user_plans(user_id, baseline_all_complete);

-- Enable Row Level Security
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own plan"
  ON user_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plan"
  ON user_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan"
  ON user_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all plans"
  ON user_plans FOR ALL
  USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE TRIGGER update_user_plans_updated_at
  BEFORE UPDATE ON user_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE user_plans IS 'AI-generated personalized career plans for users';
COMMENT ON COLUMN user_plans.plan_version IS 'Version number, incremented if user regenerates plan';
COMMENT ON COLUMN user_plans.onboarding_snapshot IS 'Copy of onboarding data at time of plan generation';
COMMENT ON COLUMN user_plans.summary IS 'Personalized summary paragraph from AI';
COMMENT ON COLUMN user_plans.baseline_actions IS 'Array of ActionSection objects with one-time setup actions';
COMMENT ON COLUMN user_plans.weekly_goals_description IS 'Description for the weekly goals section';
COMMENT ON COLUMN user_plans.target_role IS 'User target role (e.g., Senior Product Manager)';
COMMENT ON COLUMN user_plans.target_date IS 'Target date calculated from timeline selection';
COMMENT ON COLUMN user_plans.timeline_selection IS 'User-selected timeline (1_month, 3_months, etc.)';
COMMENT ON COLUMN user_plans.baseline_all_complete IS 'Flag set when all baseline actions are done';
COMMENT ON COLUMN user_plans.baseline_completed_at IS 'Timestamp when all baseline actions were completed';
