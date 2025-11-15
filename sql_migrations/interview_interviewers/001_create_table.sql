-- Migration: Create interview_interviewers table
-- Description: Junction table linking interviews to contacts (interviewers)
-- Created: 2025-11-15

CREATE TABLE IF NOT EXISTS interview_interviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role interviewer_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(interview_id, contact_id)
);

-- Add comments
COMMENT ON TABLE interview_interviewers IS 'Junction table linking interviews to contacts who are interviewers';
COMMENT ON COLUMN interview_interviewers.role IS 'Role of contact in the interview (interviewer, panel_member, observer)';

