-- Migration: Create user_progress table
-- Description: Track which lessons users have completed
-- Created: 2025-11-15

CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  watch_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Add comments for documentation
COMMENT ON TABLE user_progress IS 'Track user progress through lessons';
COMMENT ON COLUMN user_progress.completed IS 'Whether user has completed this lesson';
COMMENT ON COLUMN user_progress.watch_duration_seconds IS 'Total time user has spent watching';
COMMENT ON CONSTRAINT user_progress_user_id_lesson_id_key ON user_progress IS 'Each user can only have one progress record per lesson';

