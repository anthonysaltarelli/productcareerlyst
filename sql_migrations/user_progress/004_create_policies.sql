-- Migration: RLS Policies for user_progress table
-- Description: Users can only see and manage their own progress
-- Created: 2025-11-15

-- Users can view their own progress
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

