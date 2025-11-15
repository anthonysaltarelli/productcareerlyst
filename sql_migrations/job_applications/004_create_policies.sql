-- Migration: Create RLS policies for job_applications table
-- Description: Users can only access their own applications
-- Created: 2025-11-15

-- Policy: Users can view their own applications
CREATE POLICY "Users can view their own job applications"
  ON job_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own applications
CREATE POLICY "Users can insert their own job applications"
  ON job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own applications
CREATE POLICY "Users can update their own job applications"
  ON job_applications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own applications
CREATE POLICY "Users can delete their own job applications"
  ON job_applications FOR DELETE
  USING (auth.uid() = user_id);

