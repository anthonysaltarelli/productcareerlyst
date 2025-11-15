-- Migration: Create triggers for companies table
-- Description: Auto-update timestamps
-- Created: 2025-11-15

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

