-- Migration: Create indexes for lessons table
-- Description: Add indexes for better query performance
-- Created: 2025-11-15

CREATE INDEX IF NOT EXISTS idx_lessons_course 
  ON lessons(course_id);

CREATE INDEX IF NOT EXISTS idx_lessons_prioritization 
  ON lessons(prioritization);

-- Comments
COMMENT ON INDEX idx_lessons_course IS 'Fast lookup of lessons by course';
COMMENT ON INDEX idx_lessons_prioritization IS 'Fast lookup of lessons by display order';

