-- Migration: Create portfolio_idea_ratings table
-- Description: Stores user ratings (thumbs up/down) and feedback for portfolio ideas
-- Created: 2025-01-XX

CREATE TABLE IF NOT EXISTS portfolio_idea_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES portfolio_ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('up', 'down')),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_idea_ratings_idea_id ON portfolio_idea_ratings(idea_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_idea_ratings_user_id ON portfolio_idea_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_idea_ratings_rating ON portfolio_idea_ratings(rating);

-- Enable RLS
ALTER TABLE portfolio_idea_ratings ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE portfolio_idea_ratings IS 'User ratings and feedback for portfolio case study ideas';
COMMENT ON COLUMN portfolio_idea_ratings.rating IS 'Rating value: "up" for thumbs up, "down" for thumbs down';
COMMENT ON COLUMN portfolio_idea_ratings.feedback IS 'Optional feedback text when rating is "down"';

