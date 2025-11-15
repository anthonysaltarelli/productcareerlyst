-- Migration: Create company_research table
-- Description: AI-generated research shared across all users (one per company)
-- Created: 2025-11-15

CREATE TABLE IF NOT EXISTS company_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  perplexity_response JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE company_research IS 'AI-generated company research shared across all users';
COMMENT ON COLUMN company_research.perplexity_response IS 'Full Perplexity API response including content and citations';
COMMENT ON COLUMN company_research.expires_at IS 'Cache expiration timestamp for regenerating stale research';

