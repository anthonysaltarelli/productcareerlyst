-- =====================================================
-- Change font_size from INTEGER to DECIMAL
-- =====================================================
-- Allows decimal font sizes (e.g., 10.5, 11.5) for more precise typography control

-- Change font_size column type from INTEGER to DECIMAL(4,1)
-- DECIMAL(4,1) allows values like 8.0 to 16.9 (4 digits total, 1 decimal place)
ALTER TABLE resume_styles
ALTER COLUMN font_size TYPE DECIMAL(4,1) USING font_size::DECIMAL(4,1);

-- Update the constraint to work with DECIMAL
-- Drop the old constraint if it exists
ALTER TABLE resume_styles
DROP CONSTRAINT IF EXISTS resume_styles_font_size_valid;

-- Add new constraint for DECIMAL range
ALTER TABLE resume_styles
ADD CONSTRAINT resume_styles_font_size_valid 
CHECK (font_size >= 8.0 AND font_size <= 16.0);

