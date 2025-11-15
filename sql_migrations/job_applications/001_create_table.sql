-- Migration: Create job_applications table
-- Description: User's job applications (private per user)
-- Created: 2025-11-15

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  location TEXT,
  work_mode work_mode,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency currency_code DEFAULT 'USD',
  job_url TEXT,
  description TEXT,
  status application_status NOT NULL DEFAULT 'wishlist',
  priority priority_level DEFAULT 'medium',
  applied_date DATE,
  deadline DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE job_applications IS 'User job applications (private per user)';
COMMENT ON COLUMN job_applications.notes IS 'Private user notes about the application';
COMMENT ON COLUMN job_applications.status IS 'Current status of the application';

