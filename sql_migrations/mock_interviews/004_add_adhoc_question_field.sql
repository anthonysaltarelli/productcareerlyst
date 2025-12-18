-- Migration: Add adhoc_question field for ad-hoc quick question practice sessions
-- This supports practicing questions that aren't from the pm_interview_questions table,
-- such as questions generated during job-specific mock interviews.

ALTER TABLE mock_interviews
ADD COLUMN IF NOT EXISTS adhoc_question JSONB;

COMMENT ON COLUMN mock_interviews.adhoc_question IS
'Stores ad-hoc question data for quick practice sessions not from the question bank.
Structure: { question: string, category: string, source?: { type: "job_specific", companyName: string, jobTitle: string } }';
