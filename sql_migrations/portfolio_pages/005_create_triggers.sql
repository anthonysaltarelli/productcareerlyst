-- Trigger for updated_at on portfolio_pages table

CREATE TRIGGER update_portfolio_pages_updated_at
  BEFORE UPDATE ON portfolio_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to set published_at when page is first published
CREATE OR REPLACE FUNCTION set_portfolio_page_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set published_at when page is first published
  IF NEW.is_published = true AND OLD.is_published = false AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set published_at
CREATE TRIGGER set_portfolio_pages_published_at
  BEFORE UPDATE ON portfolio_pages
  FOR EACH ROW
  EXECUTE FUNCTION set_portfolio_page_published_at();







