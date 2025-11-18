-- Migration: Create resume_analyses table
-- Description: Stores AI-generated resume analysis results
-- Created: 2025-01-16

CREATE TABLE IF NOT EXISTS resume_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_version_id UUID NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE resume_analyses IS 'AI-generated resume analysis results';
COMMENT ON COLUMN resume_analyses.overall_score IS 'Overall resume score (0-100)';
COMMENT ON COLUMN resume_analyses.analysis_data IS 'Complete analysis data including category scores, keywords, recommendations, etc.';

