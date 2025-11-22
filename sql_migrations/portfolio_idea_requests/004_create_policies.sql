-- Migration: Create RLS policies for portfolio_idea_requests table
-- Description: Users can only access their own requests
-- Created: 2025-01-XX

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own portfolio idea requests"
  ON portfolio_idea_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own requests
CREATE POLICY "Users can insert their own portfolio idea requests"
  ON portfolio_idea_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own requests
CREATE POLICY "Users can update their own portfolio idea requests"
  ON portfolio_idea_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own requests
CREATE POLICY "Users can delete their own portfolio idea requests"
  ON portfolio_idea_requests FOR DELETE
  USING (auth.uid() = user_id);

