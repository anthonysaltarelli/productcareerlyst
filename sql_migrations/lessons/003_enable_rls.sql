-- Migration: Enable Row Level Security for lessons
-- Description: Enable RLS to control access
-- Created: 2025-11-15

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

