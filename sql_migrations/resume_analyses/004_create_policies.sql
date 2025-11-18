-- Migration: Create RLS policies for resume_analyses table
-- Description: Users can only access their own analyses
-- Created: 2025-01-16

-- Policy: Users can view their own analyses
CREATE POLICY "Users can view their own resume analyses"
  ON resume_analyses FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own analyses
CREATE POLICY "Users can insert their own resume analyses"
  ON resume_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own analyses
CREATE POLICY "Users can update their own resume analyses"
  ON resume_analyses FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own analyses
CREATE POLICY "Users can delete their own resume analyses"
  ON resume_analyses FOR DELETE
  USING (auth.uid() = user_id);

