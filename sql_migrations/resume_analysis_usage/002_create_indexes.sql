-- Migration: Create indexes for resume_analysis_usage table
-- Description: Indexes for query optimization
-- Created: 2025-01-16

CREATE INDEX IF NOT EXISTS idx_resume_analysis_usage_user_id 
  ON resume_analysis_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_resume_analysis_usage_month_year 
  ON resume_analysis_usage(month_year);

CREATE INDEX IF NOT EXISTS idx_resume_analysis_usage_user_month 
  ON resume_analysis_usage(user_id, month_year);

