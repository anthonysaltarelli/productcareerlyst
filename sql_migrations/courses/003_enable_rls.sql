-- Migration: Enable Row Level Security for courses
-- Description: Enable RLS to control access
-- Created: 2025-11-15

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

