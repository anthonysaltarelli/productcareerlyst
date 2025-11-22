-- Migration: Create portfolio_idea_favorites table
-- Description: Stores user favorites for portfolio ideas
-- Created: 2025-01-XX

CREATE TABLE IF NOT EXISTS portfolio_idea_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES portfolio_ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_idea_favorites_idea_id ON portfolio_idea_favorites(idea_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_idea_favorites_user_id ON portfolio_idea_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_idea_favorites_created_at ON portfolio_idea_favorites(created_at DESC);

-- Enable RLS
ALTER TABLE portfolio_idea_favorites ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE portfolio_idea_favorites IS 'User favorites for portfolio case study ideas';

