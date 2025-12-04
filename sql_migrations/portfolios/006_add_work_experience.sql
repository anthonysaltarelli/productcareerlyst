-- Add work_experience field to portfolios table
-- This stores the career history for display on the public portfolio

-- Add the work_experience column as JSONB
ALTER TABLE portfolios 
ADD COLUMN IF NOT EXISTS work_experience JSONB DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN portfolios.work_experience IS 'JSON array of work experience entries for portfolio display. Structure: [{company, title, is_current, display_order}]';

-- Example structure:
-- [
--   {
--     "company": "Bloomberg",
--     "title": "Software Engineering Intern",
--     "is_current": true,
--     "display_order": 0
--   },
--   {
--     "company": "1Password",
--     "title": "Product Design Intern", 
--     "is_current": false,
--     "display_order": 1
--   }
-- ]




