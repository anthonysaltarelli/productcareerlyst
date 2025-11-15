-- Migration: Create triggers for company_research table
-- Description: Auto-update timestamps
-- Created: 2025-11-15

CREATE TRIGGER update_company_research_updated_at
  BEFORE UPDATE ON company_research
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

