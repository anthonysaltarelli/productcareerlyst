-- Migration: Create updated_at trigger for user_progress
-- Description: Automatically update updated_at timestamp
-- Created: 2025-11-15

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

