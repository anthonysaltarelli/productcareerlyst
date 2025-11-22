-- Migration: Create portfolio_idea_requests table
-- Description: Stores user requests for portfolio case study ideas
-- Created: 2025-01-XX

CREATE TABLE IF NOT EXISTS portfolio_idea_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE portfolio_idea_requests IS 'User requests for portfolio case study ideas';
COMMENT ON COLUMN portfolio_idea_requests.input_text IS 'User input: industry, company name, or combination';

