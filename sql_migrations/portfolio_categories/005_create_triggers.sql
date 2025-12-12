-- Trigger for updated_at on portfolio_categories table

CREATE TRIGGER update_portfolio_categories_updated_at
  BEFORE UPDATE ON portfolio_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();







