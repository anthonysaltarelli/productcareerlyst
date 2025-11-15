-- Migration: Create triggers for contacts table
-- Description: Auto-update timestamps
-- Created: 2025-11-15

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

