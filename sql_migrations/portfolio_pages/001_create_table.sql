-- Portfolio Pages table - Individual case study/project pages
-- Each page belongs to a category and contains metadata + TipTap content

CREATE TABLE IF NOT EXISTS portfolio_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  category_id UUID REFERENCES portfolio_categories(id) ON DELETE SET NULL,
  
  -- Page metadata (shown in cards/previews)
  title TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL-friendly slug for this page
  description TEXT, -- Short description for preview cards
  cover_image_url TEXT, -- Cover/hero image
  tags TEXT[] DEFAULT '{}', -- Array of tags (e.g., "E-commerce", "UX Design", "Mobile")
  
  -- Main content (TipTap JSON)
  content JSONB DEFAULT '{}', -- TipTap editor content stored as JSON
  
  -- Display settings
  display_order INTEGER DEFAULT 0, -- Order within category
  is_published BOOLEAN DEFAULT false, -- Individual page publish status
  is_featured BOOLEAN DEFAULT false, -- Feature on homepage carousel
  
  -- SEO/Meta
  meta_title TEXT, -- Custom SEO title (defaults to title)
  meta_description TEXT, -- Custom SEO description (defaults to description)
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE, -- When page was first published
  
  -- Slug must be unique within a portfolio
  CONSTRAINT unique_page_slug_per_portfolio UNIQUE (portfolio_id, slug)
);

-- Add comment for documentation
COMMENT ON TABLE portfolio_pages IS 'Individual portfolio pages/case studies with TipTap content';
COMMENT ON COLUMN portfolio_pages.content IS 'TipTap editor content stored as JSON';
COMMENT ON COLUMN portfolio_pages.tags IS 'Array of tags for filtering and display';
COMMENT ON COLUMN portfolio_pages.is_featured IS 'Featured pages appear prominently on portfolio homepage';


