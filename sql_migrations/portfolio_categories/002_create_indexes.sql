-- Indexes for portfolio_categories table

CREATE INDEX IF NOT EXISTS idx_portfolio_categories_portfolio_id ON portfolio_categories(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_categories_display_order ON portfolio_categories(portfolio_id, display_order);






