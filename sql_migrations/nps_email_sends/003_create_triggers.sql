-- Migration: Create triggers for nps_email_sends table
-- Description: Auto-update updated_at timestamp
-- Created: 2025-01-XX

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_nps_email_sends_updated_at
  BEFORE UPDATE ON nps_email_sends
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

