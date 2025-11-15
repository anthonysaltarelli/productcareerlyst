-- Migration: Enable Row Level Security for categories
-- Description: Enable RLS to control access
-- Created: 2025-11-15

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

