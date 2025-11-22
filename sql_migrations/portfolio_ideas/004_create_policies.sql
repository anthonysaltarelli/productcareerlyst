-- Migration: Create RLS policies for portfolio_ideas table
-- Description: Users can only access ideas from their own requests
-- Created: 2025-01-XX

-- Policy: Users can view ideas from their own requests
CREATE POLICY "Users can view their own portfolio ideas"
  ON portfolio_ideas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_idea_requests
      WHERE portfolio_idea_requests.id = portfolio_ideas.request_id
      AND portfolio_idea_requests.user_id = auth.uid()
    )
  );

-- Policy: Users can insert ideas for their own requests
CREATE POLICY "Users can insert their own portfolio ideas"
  ON portfolio_ideas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio_idea_requests
      WHERE portfolio_idea_requests.id = portfolio_ideas.request_id
      AND portfolio_idea_requests.user_id = auth.uid()
    )
  );

-- Policy: Users can update ideas from their own requests
CREATE POLICY "Users can update their own portfolio ideas"
  ON portfolio_ideas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_idea_requests
      WHERE portfolio_idea_requests.id = portfolio_ideas.request_id
      AND portfolio_idea_requests.user_id = auth.uid()
    )
  );

-- Policy: Users can delete ideas from their own requests
CREATE POLICY "Users can delete their own portfolio ideas"
  ON portfolio_ideas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM portfolio_idea_requests
      WHERE portfolio_idea_requests.id = portfolio_ideas.request_id
      AND portfolio_idea_requests.user_id = auth.uid()
    )
  );

