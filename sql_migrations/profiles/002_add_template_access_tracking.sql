-- Migration: Add template access tracking to profiles table
-- Description: Track when users first access templates/resources
-- Created: 2025-01-XX

-- Add column to track first template access
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_template_accessed_at TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN profiles.first_template_accessed_at IS 'Timestamp when user first accessed templates/resources page';


