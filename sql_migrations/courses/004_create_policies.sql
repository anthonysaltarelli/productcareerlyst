-- Migration: RLS Policies for courses table
-- Description: Public can read published courses, authenticated users can manage
-- Created: 2025-11-15

-- Published courses are viewable by everyone
CREATE POLICY "Courses are viewable by everyone"
  ON courses FOR SELECT
  USING (is_published = true);

-- Courses are manageable by authenticated users
CREATE POLICY "Courses are manageable by authenticated users"
  ON courses FOR ALL
  USING (auth.role() = 'authenticated');

