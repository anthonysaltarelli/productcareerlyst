-- Migration: Create updated_at trigger for courses
-- Description: Automatically update updated_at timestamp
-- Created: 2025-11-15

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

