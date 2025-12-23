-- Migration: Remove is_featured column from portfolio_pages
-- This feature was never fully implemented (no UI toggle existed)

-- Drop the index first
DROP INDEX IF EXISTS idx_portfolio_pages_is_featured;

-- Drop the column
ALTER TABLE portfolio_pages DROP COLUMN IF EXISTS is_featured;
