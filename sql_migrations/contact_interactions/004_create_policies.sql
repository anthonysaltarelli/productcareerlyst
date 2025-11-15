-- Migration: Create RLS policies for contact_interactions table
-- Description: Users can only access their own contact interactions
-- Created: 2025-11-15

-- Policy: Users can view their own contact interactions
CREATE POLICY "Users can view their own contact interactions"
  ON contact_interactions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own contact interactions
CREATE POLICY "Users can insert their own contact interactions"
  ON contact_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own contact interactions
CREATE POLICY "Users can update their own contact interactions"
  ON contact_interactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own contact interactions
CREATE POLICY "Users can delete their own contact interactions"
  ON contact_interactions FOR DELETE
  USING (auth.uid() = user_id);

