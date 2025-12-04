-- =====================================================
-- Add is_admin column to profiles table
-- =====================================================
-- Adds admin flag to profiles for admin dashboard access

-- Add is_admin column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin 
  ON profiles(is_admin) 
  WHERE is_admin = true;

-- Set specific user as admin
-- User ID: 956ba5d8-5a20-4ee4-8da2-850fee569ac1
UPDATE profiles 
SET is_admin = true 
WHERE user_id = '956ba5d8-5a20-4ee4-8da2-850fee569ac1';

-- Add comment
COMMENT ON COLUMN profiles.is_admin IS 'Admin flag for admin dashboard access';

