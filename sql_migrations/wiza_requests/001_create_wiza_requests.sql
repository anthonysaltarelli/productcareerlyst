-- Migration: Create wiza_requests table
-- Description: Store Wiza API requests and results for contact discovery
-- Created: 2025-11-21

CREATE TABLE IF NOT EXISTS wiza_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
  
  -- Request details
  wiza_list_id TEXT, -- Wiza API list ID (can be numeric string)
  search_name TEXT NOT NULL, -- Company name or LinkedIn URL used for search
  search_type TEXT NOT NULL DEFAULT 'company_name', -- 'company_name' or 'linkedin_url'
  max_profiles INTEGER DEFAULT 10,
  job_titles TEXT[], -- Array of job titles searched
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'no_contacts'
  wiza_status TEXT, -- Raw status from Wiza API ('queued', 'processing', 'completed', etc.)
  
  -- Results
  contacts_found INTEGER DEFAULT 0,
  contacts_imported INTEGER DEFAULT 0,
  error_message TEXT,
  wiza_response JSONB, -- Full response from Wiza API for debugging
  
  -- Metadata
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wiza_requests_user_id ON wiza_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_wiza_requests_company_id ON wiza_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_wiza_requests_application_id ON wiza_requests(application_id);
CREATE INDEX IF NOT EXISTS idx_wiza_requests_status ON wiza_requests(status);
CREATE INDEX IF NOT EXISTS idx_wiza_requests_wiza_list_id ON wiza_requests(wiza_list_id);

-- Enable Row Level Security
ALTER TABLE wiza_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own wiza requests"
  ON wiza_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wiza requests"
  ON wiza_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wiza requests"
  ON wiza_requests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE wiza_requests IS 'Wiza API requests and results for contact discovery (private per user)';
COMMENT ON COLUMN wiza_requests.wiza_list_id IS 'Wiza API list ID (stored as text to handle numeric IDs)';
COMMENT ON COLUMN wiza_requests.search_name IS 'Company name or LinkedIn URL used for the search';
COMMENT ON COLUMN wiza_requests.search_type IS 'Type of search: company_name or linkedin_url';
COMMENT ON COLUMN wiza_requests.status IS 'Request status: pending, processing, completed, failed, no_contacts';
COMMENT ON COLUMN wiza_requests.wiza_status IS 'Raw status from Wiza API';
COMMENT ON COLUMN wiza_requests.wiza_response IS 'Full JSON response from Wiza API for debugging';

