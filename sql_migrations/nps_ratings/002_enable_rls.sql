-- Migration: Enable RLS policies for nps_ratings table
-- Description: Allow unauthenticated users to submit ratings, authenticated users can view/update their own
-- Created: 2025-01-XX

-- Policy: Anyone can insert ratings (unauthenticated or authenticated)
CREATE POLICY "Anyone can insert nps ratings"
  ON nps_ratings FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own rating (if authenticated)
CREATE POLICY "Users can view their own nps rating"
  ON nps_ratings FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can update their own rating (if authenticated and rating has user_id)
CREATE POLICY "Users can update their own nps rating"
  ON nps_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

