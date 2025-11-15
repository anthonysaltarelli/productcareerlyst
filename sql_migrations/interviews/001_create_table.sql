-- Migration: Create interviews table
-- Description: Interview rounds for job applications (private per user)
-- Created: 2025-11-15

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type interview_type,
  status interview_status NOT NULL DEFAULT 'scheduled',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  location TEXT,
  meeting_link TEXT,
  prep_notes TEXT,
  feedback TEXT,
  outcome interview_outcome,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE interviews IS 'Interview rounds for job applications (private per user)';
COMMENT ON COLUMN interviews.prep_notes IS 'Preparation notes before the interview';
COMMENT ON COLUMN interviews.feedback IS 'Post-interview feedback and reflections';
COMMENT ON COLUMN interviews.outcome IS 'Interview outcome: passed, failed, or pending';

