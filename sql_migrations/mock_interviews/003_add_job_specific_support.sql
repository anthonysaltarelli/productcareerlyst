-- Add job-specific interview support to mock_interviews table
-- This migration adds support for mock interviews tied to specific job applications

-- Add job application reference
ALTER TABLE mock_interviews
ADD COLUMN IF NOT EXISTS job_application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL;

-- Add company reference for easier evaluation context
ALTER TABLE mock_interviews
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Add generated questions storage (array of questions used in this session)
ALTER TABLE mock_interviews
ADD COLUMN IF NOT EXISTS generated_questions JSONB;

-- Add job context snapshot (job title, company name, description snippet used for generation)
ALTER TABLE mock_interviews
ADD COLUMN IF NOT EXISTS job_context JSONB;

-- Index for job application lookups
CREATE INDEX IF NOT EXISTS idx_mock_interviews_job_application_id ON mock_interviews(job_application_id);

-- Index for company lookups
CREATE INDEX IF NOT EXISTS idx_mock_interviews_company_id ON mock_interviews(company_id);

-- Note: interview_mode column already exists with values 'full', 'quick_question'
-- We'll use 'job_specific' as a new valid value for this column
