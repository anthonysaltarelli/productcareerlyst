-- Migration: Change user_id to TEXT to allow any identifier (not just real user IDs)
-- Description: Remove foreign key constraint and allow any string as user_id for tracking purposes
-- Created: 2025-01-XX

-- Drop existing policies (they reference user_id)
DROP POLICY IF EXISTS "Anyone can insert nps ratings" ON nps_ratings;
DROP POLICY IF EXISTS "Users can view their own nps rating" ON nps_ratings;
DROP POLICY IF EXISTS "Users can update their own nps rating" ON nps_ratings;

-- Drop the foreign key constraint and unique index
ALTER TABLE nps_ratings DROP CONSTRAINT IF EXISTS nps_ratings_user_id_fkey;
DROP INDEX IF EXISTS idx_nps_ratings_user_id_unique;
DROP INDEX IF EXISTS idx_nps_ratings_user_id;

-- Change user_id column to TEXT
ALTER TABLE nps_ratings ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Recreate unique index for non-null user_ids
CREATE UNIQUE INDEX IF NOT EXISTS idx_nps_ratings_user_id_unique 
  ON nps_ratings(user_id) 
  WHERE user_id IS NOT NULL;

-- Recreate regular index
CREATE INDEX IF NOT EXISTS idx_nps_ratings_user_id ON nps_ratings(user_id);

-- Recreate policies (updated to handle TEXT user_id)
-- Policy: Anyone can insert ratings (unauthenticated or authenticated)
-- Explicitly allow all roles (public) to insert
CREATE POLICY "Anyone can insert nps ratings"
  ON nps_ratings FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Users can view their own rating (if authenticated and user_id matches their UUID as text)
-- Also allow viewing ratings with null user_id
CREATE POLICY "Users can view their own nps rating"
  ON nps_ratings FOR SELECT
  USING (user_id = auth.uid()::TEXT OR user_id IS NULL);

-- Policy: Users can update their own rating (if authenticated and user_id matches their UUID as text)
CREATE POLICY "Users can update their own nps rating"
  ON nps_ratings FOR UPDATE
  USING (user_id = auth.uid()::TEXT)
  WITH CHECK (user_id = auth.uid()::TEXT);

-- Update comment
COMMENT ON COLUMN nps_ratings.user_id IS 'User identifier (can be any string, not necessarily a real user ID)';
