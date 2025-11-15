-- Migration: Create updated_at trigger for lessons
-- Description: Automatically update updated_at timestamp
-- Created: 2025-11-15

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

