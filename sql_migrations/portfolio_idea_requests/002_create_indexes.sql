-- Migration: Create indexes for portfolio_idea_requests table
-- Description: Optimize queries
-- Created: 2025-01-XX

CREATE INDEX IF NOT EXISTS idx_portfolio_idea_requests_user_id ON portfolio_idea_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_idea_requests_created_at ON portfolio_idea_requests(created_at DESC);

