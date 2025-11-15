-- Migration: Enable Row Level Security for user_progress
-- Description: Enable RLS to control access
-- Created: 2025-11-15

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

