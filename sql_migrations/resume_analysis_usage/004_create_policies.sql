-- Migration: Create RLS policies for resume_analysis_usage table
-- Description: Users can only access their own usage data
-- Created: 2025-01-16

-- Policy: Users can view their own usage
CREATE POLICY "Users can view their own analysis usage"
  ON resume_analysis_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own usage
CREATE POLICY "Users can insert their own analysis usage"
  ON resume_analysis_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own usage
CREATE POLICY "Users can update their own analysis usage"
  ON resume_analysis_usage FOR UPDATE
  USING (auth.uid() = user_id);

