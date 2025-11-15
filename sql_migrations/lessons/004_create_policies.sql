-- Migration: RLS Policies for lessons table
-- Description: Public can read, authenticated users can manage
-- Created: 2025-11-15

-- Lessons are viewable by everyone
CREATE POLICY "Lessons are viewable by everyone"
  ON lessons FOR SELECT
  USING (true);

-- Lessons are manageable by authenticated users
CREATE POLICY "Lessons are manageable by authenticated users"
  ON lessons FOR ALL
  USING (auth.role() = 'authenticated');

