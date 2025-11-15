-- Migration: Create categories table
-- Description: Table for organizing courses into logical groups
-- Created: 2025-11-15

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE categories IS 'Course categories for organizing learning content';
COMMENT ON COLUMN categories.slug IS 'URL-friendly identifier for the category';
COMMENT ON COLUMN categories.display_order IS 'Order in which categories should be displayed';

