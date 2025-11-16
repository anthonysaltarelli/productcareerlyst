-- =====================================================
-- Add Role Grouping Support to Resume Experiences
-- =====================================================
-- Allows multiple roles within the same company to be grouped together
-- role_group_id: UUID that groups experiences by company/role set
-- If NULL, the experience is standalone
-- If set, all experiences with the same role_group_id are grouped together

-- Add role_group_id column
ALTER TABLE resume_experiences 
ADD COLUMN IF NOT EXISTS role_group_id UUID;

-- Add index for role_group_id lookups
CREATE INDEX IF NOT EXISTS idx_resume_experiences_role_group_id 
ON resume_experiences(role_group_id) 
WHERE role_group_id IS NOT NULL;

-- Add display mode to resume_styles for experience display preferences
-- 'by_role' = bullets within each role
-- 'grouped' = titles stacked, then all bullets below
ALTER TABLE resume_styles
ADD COLUMN IF NOT EXISTS experience_display_mode VARCHAR(20) DEFAULT 'by_role';

-- Add constraint for valid display modes
-- Drop constraint if it exists, then add it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_experience_display_mode'
        AND table_name = 'resume_styles'
    ) THEN
        ALTER TABLE resume_styles DROP CONSTRAINT check_experience_display_mode;
    END IF;
END $$;

ALTER TABLE resume_styles
ADD CONSTRAINT check_experience_display_mode 
CHECK (experience_display_mode IN ('by_role', 'grouped'));

