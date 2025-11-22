-- Migration: Create triggers for portfolio_idea_requests table
-- Description: Auto-update timestamps
-- Created: 2025-01-XX

CREATE TRIGGER update_portfolio_idea_requests_updated_at
  BEFORE UPDATE ON portfolio_idea_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

