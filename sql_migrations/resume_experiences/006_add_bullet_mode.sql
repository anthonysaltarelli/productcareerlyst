-- =====================================================
-- Add Bullet Mode Support to Resume Experiences
-- =====================================================
-- Stores how bullets are organized for grouped experiences
-- 'per_role' = bullets are specific to each role
-- 'per_experience' = bullets are shared across all roles in the group
-- Only the first experience in a group (lowest display_order) stores this value

-- Add bullet_mode column
ALTER TABLE resume_experiences 
ADD COLUMN IF NOT EXISTS bullet_mode VARCHAR(20) DEFAULT 'per_role';

-- Add constraint for valid bullet modes
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_bullet_mode'
        AND table_name = 'resume_experiences'
    ) THEN
        ALTER TABLE resume_experiences DROP CONSTRAINT check_bullet_mode;
    END IF;
END $$;

ALTER TABLE resume_experiences
ADD CONSTRAINT check_bullet_mode 
CHECK (bullet_mode IN ('per_role', 'per_experience') OR bullet_mode IS NULL);

