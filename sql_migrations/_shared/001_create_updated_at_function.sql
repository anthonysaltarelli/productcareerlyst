-- Migration: Create updated_at trigger function
-- Description: Shared function to automatically update updated_at timestamp
-- Created: 2025-11-15
-- Note: Run this FIRST before any table migrations

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at column on row update';

