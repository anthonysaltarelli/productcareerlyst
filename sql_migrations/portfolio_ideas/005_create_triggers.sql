-- Migration: Create triggers for portfolio_ideas table
-- Description: Auto-update timestamps
-- Created: 2025-01-XX

CREATE TRIGGER update_portfolio_ideas_updated_at
  BEFORE UPDATE ON portfolio_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

