-- RLS Policies for portfolio_categories table

-- Categories are viewable if the portfolio is published
CREATE POLICY "Categories are viewable when portfolio is published"
  ON portfolio_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = portfolio_categories.portfolio_id 
      AND portfolios.is_published = true
    )
  );

-- Users can view their own portfolio categories
CREATE POLICY "Users can view their own portfolio categories"
  ON portfolio_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = portfolio_categories.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

-- Users can create categories for their own portfolio
CREATE POLICY "Users can create categories for their own portfolio"
  ON portfolio_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = portfolio_categories.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

-- Users can update their own portfolio categories
CREATE POLICY "Users can update their own portfolio categories"
  ON portfolio_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = portfolio_categories.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

-- Users can delete their own portfolio categories
CREATE POLICY "Users can delete their own portfolio categories"
  ON portfolio_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = portfolio_categories.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );


