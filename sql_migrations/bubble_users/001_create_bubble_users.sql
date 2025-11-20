-- Migration: Create bubble_users table
-- Description: Stores exported Bubble user data for migration matching
-- Created: 2025-01-16

-- Create bubble_users table
CREATE TABLE IF NOT EXISTS bubble_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  stripe_customer_id TEXT,
  current_plan TEXT,
  subscription_status TEXT,
  subscription_id TEXT,
  subscription_start TEXT,
  subscription_end TEXT,
  subscription_frequency TEXT,
  bubble_unique_id TEXT,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  matched_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  matched_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT bubble_users_email_lowercase CHECK (email = LOWER(email))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bubble_users_email ON bubble_users(email);
CREATE INDEX IF NOT EXISTS idx_bubble_users_stripe_customer_id ON bubble_users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL AND stripe_customer_id != '';
CREATE INDEX IF NOT EXISTS idx_bubble_users_matched_user_id ON bubble_users(matched_user_id) WHERE matched_user_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE bubble_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only service role can access
CREATE POLICY "Service role can manage all bubble users"
  ON bubble_users FOR ALL
  USING (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE bubble_users IS 'Exported Bubble user data for migration matching';
COMMENT ON COLUMN bubble_users.email IS 'User email (lowercase, unique)';
COMMENT ON COLUMN bubble_users.stripe_customer_id IS 'Stripe customer ID from Bubble';
COMMENT ON COLUMN bubble_users.matched_user_id IS 'Supabase user ID if matched after signup';
COMMENT ON COLUMN bubble_users.matched_at IS 'When the user was matched and transferred';

