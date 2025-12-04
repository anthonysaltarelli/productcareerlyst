-- Migration: Create nps_ratings table
-- Description: Stores NPS (Net Promoter Score) ratings and feedback from users
-- Created: 2025-01-XX

CREATE TABLE IF NOT EXISTS nps_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 10),
  feedback TEXT,
  source TEXT, -- Track where the rating came from (e.g., 'email', 'dashboard', 'direct')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint only for non-null user_ids
CREATE UNIQUE INDEX IF NOT EXISTS idx_nps_ratings_user_id_unique 
  ON nps_ratings(user_id) 
  WHERE user_id IS NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nps_ratings_user_id ON nps_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_nps_ratings_rating ON nps_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_nps_ratings_created_at ON nps_ratings(created_at);

-- Enable RLS
ALTER TABLE nps_ratings ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE nps_ratings IS 'NPS (Net Promoter Score) ratings and feedback from users';
COMMENT ON COLUMN nps_ratings.rating IS 'NPS rating value from 0 (not likely) to 10 (very likely)';
COMMENT ON COLUMN nps_ratings.feedback IS 'Optional free-text feedback from the user';
COMMENT ON COLUMN nps_ratings.source IS 'Source of the rating (e.g., email link, dashboard, direct)';

