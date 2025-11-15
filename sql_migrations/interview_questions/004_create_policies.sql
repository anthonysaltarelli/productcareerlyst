-- Migration: Create RLS policies for interview_questions table
-- Description: Users can only access their own interview questions
-- Created: 2025-11-15

-- Policy: Users can view their own interview questions
CREATE POLICY "Users can view their own interview questions"
  ON interview_questions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own interview questions
CREATE POLICY "Users can insert their own interview questions"
  ON interview_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own interview questions
CREATE POLICY "Users can update their own interview questions"
  ON interview_questions FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own interview questions
CREATE POLICY "Users can delete their own interview questions"
  ON interview_questions FOR DELETE
  USING (auth.uid() = user_id);

