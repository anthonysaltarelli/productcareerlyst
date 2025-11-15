-- Migration: Create indexes for interview_interviewers table
-- Description: Indexes for query optimization
-- Created: 2025-11-15

CREATE INDEX IF NOT EXISTS idx_interview_interviewers_interview_id ON interview_interviewers(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_interviewers_contact_id ON interview_interviewers(contact_id);

