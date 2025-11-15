-- Migration: RLS Policies for categories table
-- Description: Public can read, authenticated users can manage
-- Created: 2025-11-15

-- Categories are viewable by everyone
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Categories are manageable by authenticated users
CREATE POLICY "Categories are manageable by authenticated users"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated');

