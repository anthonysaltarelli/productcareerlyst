-- Migration: Create updated_at trigger for categories
-- Description: Automatically update updated_at timestamp
-- Created: 2025-11-15

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

