-- Migration: Create interview_questions table
-- Description: Questions user will ask interviewers (private per user)
-- Created: 2025-11-15

CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE interview_questions IS 'Questions user prepares to ask interviewers (private per user)';
COMMENT ON COLUMN interview_questions.question IS 'Question user plans to ask';
COMMENT ON COLUMN interview_questions.answer IS 'Interviewer response (filled after interview)';

