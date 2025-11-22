-- Migration: Create indexes for portfolio_ideas table
-- Description: Optimize queries
-- Created: 2025-01-XX

CREATE INDEX IF NOT EXISTS idx_portfolio_ideas_request_id ON portfolio_ideas(request_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_ideas_created_at ON portfolio_ideas(created_at DESC);

