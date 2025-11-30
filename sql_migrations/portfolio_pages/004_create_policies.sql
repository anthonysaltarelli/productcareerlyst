-- RLS Policies for portfolio_pages table

-- Pages are viewable if both the portfolio and page are published
CREATE POLICY "Pages are viewable when portfolio and page are published"
  ON portfolio_pages FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = portfolio_pages.portfolio_id 
      AND portfolios.is_published = true
    )
  );

-- Users can view all their own portfolio pages (even if unpublished)
CREATE POLICY "Users can view their own portfolio pages"
  ON portfolio_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = portfolio_pages.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

-- Users can create pages for their own portfolio
CREATE POLICY "Users can create pages for their own portfolio"
  ON portfolio_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = portfolio_pages.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

-- Users can update their own portfolio pages
CREATE POLICY "Users can update their own portfolio pages"
  ON portfolio_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = portfolio_pages.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

-- Users can delete their own portfolio pages
CREATE POLICY "Users can delete their own portfolio pages"
  ON portfolio_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = portfolio_pages.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );


