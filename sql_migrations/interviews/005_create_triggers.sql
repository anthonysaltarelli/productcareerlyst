-- Migration: Create triggers for interviews table
-- Description: Auto-update timestamps
-- Created: 2025-11-15

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

