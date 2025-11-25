-- Migration: Add customization_summary column to resume_versions
-- Description: Stores AI-generated summary of changes when a resume is customized for a job
-- Created: 2025-01-25

-- Add customization_summary column to store AI customization details
ALTER TABLE resume_versions 
ADD COLUMN IF NOT EXISTS customization_summary JSONB DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN resume_versions.customization_summary IS 'Stores AI-generated summary of customization changes including bullet reordering, language optimization, and keyword injection details';

