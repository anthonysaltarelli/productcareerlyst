-- Migration: Create indexes for resume_analyses table
-- Description: Indexes for query optimization
-- Created: 2025-01-16

CREATE INDEX IF NOT EXISTS idx_resume_analyses_resume_version_id 
  ON resume_analyses(resume_version_id);

CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_id 
  ON resume_analyses(user_id);

CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_version 
  ON resume_analyses(user_id, resume_version_id);

CREATE INDEX IF NOT EXISTS idx_resume_analyses_created_at 
  ON resume_analyses(created_at DESC);

