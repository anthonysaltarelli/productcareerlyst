-- Migration: Create indexes for user_progress table
-- Description: Add indexes for better query performance
-- Created: 2025-11-15

CREATE INDEX IF NOT EXISTS idx_user_progress_user 
  ON user_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_lesson 
  ON user_progress(lesson_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_completed 
  ON user_progress(completed) 
  WHERE completed = true;

-- Comments
COMMENT ON INDEX idx_user_progress_user IS 'Fast lookup of progress by user';
COMMENT ON INDEX idx_user_progress_lesson IS 'Fast lookup of progress by lesson';
COMMENT ON INDEX idx_user_progress_completed IS 'Fast lookup of completed lessons';

