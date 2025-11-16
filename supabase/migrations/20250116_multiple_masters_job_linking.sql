-- Migration: Enable Multiple Master Resumes and Job Application Linking
-- Date: 2025-01-16
-- Description:
--   1. Drop constraint that enforces only one master resume per user
--   2. Add application_id column to link job-specific resumes to job applications

-- Step 1: Drop the single-master constraint
-- This allows users to have multiple master resumes
DROP INDEX IF EXISTS idx_one_master_per_user;

-- Step 2: Add application_id column to link resumes to job applications
-- This is optional (nullable) - users can create job-specific resumes without linking
ALTER TABLE resume_versions
  ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL;

-- Step 3: Add index for performance when querying by application_id
CREATE INDEX IF NOT EXISTS idx_resume_versions_application_id
  ON resume_versions(application_id);

-- Step 4: Add index for filtering by is_master (helps with UI queries)
CREATE INDEX IF NOT EXISTS idx_resume_versions_is_master
  ON resume_versions(is_master);

-- Note: Existing data is unaffected
-- - Current master resume(s) remain as is
-- - Existing non-master resumes have application_id = NULL (no job link)
-- - Users can now create additional master resumes
