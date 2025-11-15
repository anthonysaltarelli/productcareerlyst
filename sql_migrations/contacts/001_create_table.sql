-- Migration: Create contacts table
-- Description: Professional contacts at companies (private per user)
-- Created: 2025-11-15

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  relationship contact_relationship,
  last_contact_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE contacts IS 'Professional contacts at companies (private per user)';
COMMENT ON COLUMN contacts.company_id IS 'Company this contact works at (required)';
COMMENT ON COLUMN contacts.application_id IS 'Optional link to specific application';
COMMENT ON COLUMN contacts.relationship IS 'Relationship type with this contact';

