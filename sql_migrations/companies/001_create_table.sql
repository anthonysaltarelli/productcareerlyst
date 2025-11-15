-- Migration: Create companies table
-- Description: Central company directory shared across all users
-- Created: 2025-11-15

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  website TEXT,
  linkedin_url TEXT,
  industry company_industry,
  size company_size,
  headquarters_city TEXT,
  headquarters_state TEXT,
  headquarters_country TEXT DEFAULT 'USA',
  description TEXT,
  founded_year INTEGER,
  is_approved BOOLEAN DEFAULT false,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE companies IS 'Central company directory shared across all users';
COMMENT ON COLUMN companies.is_approved IS 'Admin approval flag for user-created companies';
COMMENT ON COLUMN companies.created_by_user_id IS 'User who created this company entry';

