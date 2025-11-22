-- Migration: Create RLS policies for portfolio_idea_ratings table
-- Description: Users can only access their own ratings
-- Created: 2025-01-XX

-- Policy: Users can view ratings for ideas they have access to
CREATE POLICY "Users can view ratings for their ideas"
  ON portfolio_idea_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_ideas
      JOIN portfolio_idea_requests ON portfolio_idea_requests.id = portfolio_ideas.request_id
      WHERE portfolio_ideas.id = portfolio_idea_ratings.idea_id
      AND portfolio_idea_requests.user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own ratings
CREATE POLICY "Users can insert their own ratings"
  ON portfolio_idea_ratings FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM portfolio_ideas
      JOIN portfolio_idea_requests ON portfolio_idea_requests.id = portfolio_ideas.request_id
      WHERE portfolio_ideas.id = portfolio_idea_ratings.idea_id
      AND portfolio_idea_requests.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
  ON portfolio_idea_ratings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings"
  ON portfolio_idea_ratings FOR DELETE
  USING (user_id = auth.uid());

