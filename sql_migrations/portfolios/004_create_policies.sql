-- RLS Policies for portfolios table

-- Published portfolios are viewable by everyone (for public portfolio pages)
CREATE POLICY "Published portfolios are viewable by everyone"
  ON portfolios FOR SELECT
  USING (is_published = true);

-- Users can view their own portfolio (even if unpublished)
CREATE POLICY "Users can view their own portfolio"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own portfolio
CREATE POLICY "Users can create their own portfolio"
  ON portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own portfolio
CREATE POLICY "Users can update their own portfolio"
  ON portfolios FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own portfolio
CREATE POLICY "Users can delete their own portfolio"
  ON portfolios FOR DELETE
  USING (auth.uid() = user_id);






