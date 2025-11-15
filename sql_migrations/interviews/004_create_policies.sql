-- Migration: Create RLS policies for interviews table
-- Description: Users can only access their own interviews
-- Created: 2025-11-15

-- Policy: Users can view their own interviews
CREATE POLICY "Users can view their own interviews"
  ON interviews FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own interviews
CREATE POLICY "Users can insert their own interviews"
  ON interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own interviews
CREATE POLICY "Users can update their own interviews"
  ON interviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own interviews
CREATE POLICY "Users can delete their own interviews"
  ON interviews FOR DELETE
  USING (auth.uid() = user_id);

