-- =====================================================
-- Add AI Video Coach Beta Access Column
-- =====================================================
-- Controls access to the AI mock interview feature
-- Defaults to false - manually grant access to beta users

-- Add column with default false
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_ai_video_coach_beta BOOLEAN NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN profiles.has_ai_video_coach_beta IS 'Whether user has beta access to AI video coach mock interviews';

-- Set all existing users to false (explicit, though default handles this)
UPDATE profiles SET has_ai_video_coach_beta = false WHERE has_ai_video_coach_beta IS NULL;
