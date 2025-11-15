-- Migration: Create indexes for courses table
-- Description: Add indexes for better query performance
-- Created: 2025-11-15

CREATE INDEX IF NOT EXISTS idx_courses_category 
  ON courses(category_id);

CREATE INDEX IF NOT EXISTS idx_courses_prioritization 
  ON courses(prioritization);

CREATE INDEX IF NOT EXISTS idx_courses_slug 
  ON courses(slug);

-- Comments
COMMENT ON INDEX idx_courses_category IS 'Fast lookup of courses by category';
COMMENT ON INDEX idx_courses_prioritization IS 'Fast lookup of courses by display order';
COMMENT ON INDEX idx_courses_slug IS 'Fast lookup of courses by URL slug';

