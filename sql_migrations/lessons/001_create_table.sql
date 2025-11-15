-- Migration: Create lessons table
-- Description: Table for video lessons within courses
-- Created: 2025-11-15

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  prioritization TEXT NOT NULL,
  requires_subscription BOOLEAN DEFAULT false,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE lessons IS 'Individual video lessons within courses';
COMMENT ON COLUMN lessons.video_url IS 'Loom video ID for the lesson';
COMMENT ON COLUMN lessons.prioritization IS 'Lesson order (can be numeric or alphanumeric like "1.1", "2.3")';
COMMENT ON COLUMN lessons.requires_subscription IS 'Whether lesson requires premium subscription';
COMMENT ON COLUMN lessons.duration_minutes IS 'Estimated lesson duration in minutes';

