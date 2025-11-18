-- Migration: Create resume_analysis_usage table
-- Description: Tracks monthly usage limits for resume analysis
-- Created: 2025-01-16

CREATE TABLE IF NOT EXISTS resume_analysis_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: "YYYY-MM" e.g., "2025-01"
  analysis_count INTEGER NOT NULL DEFAULT 0 CHECK (analysis_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Add comments
COMMENT ON TABLE resume_analysis_usage IS 'Tracks monthly usage limits for resume analysis (5 per month per user)';
COMMENT ON COLUMN resume_analysis_usage.month_year IS 'Month and year in format YYYY-MM (e.g., "2025-01")';
COMMENT ON COLUMN resume_analysis_usage.analysis_count IS 'Number of analyses performed this month';

