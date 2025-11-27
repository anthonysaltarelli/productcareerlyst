-- Migration: Convert plain text bios to HTML format
-- This enables rich text support (bold, italic, underline) for portfolio bios
-- 
-- Run with: Execute in Supabase SQL editor or via migration tool
-- Rollback: Not easily reversible - back up data before running

-- Step 1: Update bios that are plain text (not already HTML)
-- Converts line breaks to proper HTML structure
UPDATE portfolios 
SET bio = 
  CASE 
    -- If bio contains double newlines, split into paragraphs
    WHEN bio LIKE E'%\n\n%' THEN 
      '<p>' || 
      REPLACE(
        REPLACE(bio, E'\n\n', '</p><p>'),  -- Double newlines become paragraph breaks
        E'\n', '<br>'                        -- Single newlines become line breaks
      ) || 
      '</p>'
    -- If bio contains only single newlines
    WHEN bio LIKE E'%\n%' THEN 
      '<p>' || REPLACE(bio, E'\n', '<br>') || '</p>'
    -- Plain text without newlines - wrap in paragraph
    ELSE 
      '<p>' || bio || '</p>'
  END,
  updated_at = NOW()
WHERE bio IS NOT NULL 
  AND bio != ''
  AND bio NOT LIKE '<%';  -- Skip if already looks like HTML (starts with <)

-- Add a comment to document the change
COMMENT ON COLUMN portfolios.bio IS 'Rich text bio stored as HTML. Supports bold, italic, underline formatting.';

