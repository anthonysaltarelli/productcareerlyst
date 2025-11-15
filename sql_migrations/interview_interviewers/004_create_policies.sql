-- Migration: Create RLS policies for interview_interviewers table
-- Description: Users can only access their own interview-interviewer links
-- Created: 2025-11-15

-- Policy: Users can view their own interview-interviewer links
CREATE POLICY "Users can view their own interview-interviewer links"
  ON interview_interviewers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interviews
      WHERE interviews.id = interview_interviewers.interview_id
      AND interviews.user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own interview-interviewer links
CREATE POLICY "Users can insert their own interview-interviewer links"
  ON interview_interviewers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews
      WHERE interviews.id = interview_interviewers.interview_id
      AND interviews.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own interview-interviewer links
CREATE POLICY "Users can update their own interview-interviewer links"
  ON interview_interviewers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM interviews
      WHERE interviews.id = interview_interviewers.interview_id
      AND interviews.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own interview-interviewer links
CREATE POLICY "Users can delete their own interview-interviewer links"
  ON interview_interviewers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM interviews
      WHERE interviews.id = interview_interviewers.interview_id
      AND interviews.user_id = auth.uid()
    )
  );

