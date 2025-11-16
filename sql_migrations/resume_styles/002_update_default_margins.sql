-- =====================================================
-- Update Default Left/Right Margins to 0.5"
-- =====================================================
-- Changes the default values for margin_left and margin_right
-- from 0.75" to 0.5" for new resume styles

-- Alter the default values for margin_left and margin_right
ALTER TABLE resume_styles
  ALTER COLUMN margin_left SET DEFAULT 0.5,
  ALTER COLUMN margin_right SET DEFAULT 0.5;

