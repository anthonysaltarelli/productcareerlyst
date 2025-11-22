-- Migration: Create RLS policies for portfolio_idea_favorites table
-- Description: Users can only access their own favorites
-- Created: 2025-01-XX

-- Policy: Users can view their own favorites
CREATE POLICY "Users can view their own favorites"
  ON portfolio_idea_favorites FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites"
  ON portfolio_idea_favorites FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM portfolio_ideas
      JOIN portfolio_idea_requests ON portfolio_idea_requests.id = portfolio_ideas.request_id
      WHERE portfolio_ideas.id = portfolio_idea_favorites.idea_id
      AND portfolio_idea_requests.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites"
  ON portfolio_idea_favorites FOR DELETE
  USING (user_id = auth.uid());

