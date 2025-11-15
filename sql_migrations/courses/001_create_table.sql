-- Migration: Create courses table
-- Description: Table for individual courses with metadata
-- Created: 2025-11-15

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  length TEXT,
  prioritization INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE courses IS 'Individual courses containing lessons';
COMMENT ON COLUMN courses.slug IS 'URL-friendly identifier for the course';
COMMENT ON COLUMN courses.length IS 'Estimated course duration (e.g., "2 hours", "45 minutes")';
COMMENT ON COLUMN courses.prioritization IS 'Display order within category';
COMMENT ON COLUMN courses.is_published IS 'Whether the course is visible to users';

