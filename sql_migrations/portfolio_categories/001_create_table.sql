-- Portfolio Categories table - Collections for organizing portfolio pages
-- e.g., "Work", "Case Studies", "Side Projects", custom sections

CREATE TABLE IF NOT EXISTS portfolio_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  
  -- Category information
  name TEXT NOT NULL, -- e.g., "Work", "Case Studies", "Side Projects"
  description TEXT, -- Optional description for the category
  
  -- Display settings
  display_order INTEGER DEFAULT 0, -- Order in which categories appear
  is_visible BOOLEAN DEFAULT true, -- Hide category without deleting
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each category name must be unique within a portfolio
  CONSTRAINT unique_category_name_per_portfolio UNIQUE (portfolio_id, name)
);

-- Add comment for documentation
COMMENT ON TABLE portfolio_categories IS 'Categories/collections for organizing portfolio pages';
COMMENT ON COLUMN portfolio_categories.display_order IS 'Order in which categories appear on the portfolio homepage';







