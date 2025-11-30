-- Migration: Create onboarding_progress table
-- Description: Stores flexible onboarding progress data with JSONB for backwards compatibility
-- Created: 2025-01-XX

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step TEXT,
  completed_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
  skipped_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
  progress_data JSONB DEFAULT '{}'::JSONB,
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT onboarding_progress_user_id_unique UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_is_complete ON onboarding_progress(is_complete);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_current_step ON onboarding_progress(current_step);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_progress_data ON onboarding_progress USING GIN(progress_data);

-- Enable Row Level Security
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own onboarding progress"
  ON onboarding_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress"
  ON onboarding_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
  ON onboarding_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all onboarding progress"
  ON onboarding_progress FOR ALL
  USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE onboarding_progress IS 'User onboarding progress with flexible JSONB structure for backwards compatibility';
COMMENT ON COLUMN onboarding_progress.current_step IS 'Current step identifier in onboarding flow';
COMMENT ON COLUMN onboarding_progress.completed_steps IS 'Array of completed step IDs';
COMMENT ON COLUMN onboarding_progress.skipped_steps IS 'Array of skipped step IDs';
COMMENT ON COLUMN onboarding_progress.progress_data IS 'Flexible JSONB storage for all step data (resume_upload, baseline, targets, feature_interests, trial)';
COMMENT ON COLUMN onboarding_progress.is_complete IS 'Whether onboarding is finished';
COMMENT ON COLUMN onboarding_progress.completed_at IS 'When onboarding was completed';





