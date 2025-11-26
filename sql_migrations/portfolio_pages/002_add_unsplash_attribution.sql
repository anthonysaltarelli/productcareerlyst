-- Add Unsplash attribution columns to portfolio_pages table
-- These store the required attribution data for Unsplash photos
-- 
-- Migration applied via Supabase MCP on: 2025-11-26

ALTER TABLE portfolio_pages ADD COLUMN IF NOT EXISTS cover_image_source TEXT DEFAULT NULL;
COMMENT ON COLUMN portfolio_pages.cover_image_source IS 'Source of cover image: upload, template, or unsplash';

ALTER TABLE portfolio_pages ADD COLUMN IF NOT EXISTS unsplash_photo_id TEXT DEFAULT NULL;
COMMENT ON COLUMN portfolio_pages.unsplash_photo_id IS 'Unsplash photo ID for download tracking';

ALTER TABLE portfolio_pages ADD COLUMN IF NOT EXISTS unsplash_photographer_name TEXT DEFAULT NULL;
COMMENT ON COLUMN portfolio_pages.unsplash_photographer_name IS 'Unsplash photographer full name for attribution';

ALTER TABLE portfolio_pages ADD COLUMN IF NOT EXISTS unsplash_photographer_username TEXT DEFAULT NULL;
COMMENT ON COLUMN portfolio_pages.unsplash_photographer_username IS 'Unsplash photographer username for profile link';

ALTER TABLE portfolio_pages ADD COLUMN IF NOT EXISTS unsplash_download_location TEXT DEFAULT NULL;
COMMENT ON COLUMN portfolio_pages.unsplash_download_location IS 'Unsplash download endpoint URL for tracking';

-- Create index for querying unsplash photos
CREATE INDEX IF NOT EXISTS idx_portfolio_pages_unsplash_photo ON portfolio_pages(unsplash_photo_id) WHERE unsplash_photo_id IS NOT NULL;

