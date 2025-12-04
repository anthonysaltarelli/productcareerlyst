-- Indexes for portfolio_pages table

CREATE INDEX IF NOT EXISTS idx_portfolio_pages_portfolio_id ON portfolio_pages(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_pages_category_id ON portfolio_pages(category_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_pages_slug ON portfolio_pages(portfolio_id, slug);
CREATE INDEX IF NOT EXISTS idx_portfolio_pages_display_order ON portfolio_pages(category_id, display_order);
CREATE INDEX IF NOT EXISTS idx_portfolio_pages_is_published ON portfolio_pages(portfolio_id, is_published);
CREATE INDEX IF NOT EXISTS idx_portfolio_pages_is_featured ON portfolio_pages(portfolio_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_portfolio_pages_tags ON portfolio_pages USING GIN(tags);




