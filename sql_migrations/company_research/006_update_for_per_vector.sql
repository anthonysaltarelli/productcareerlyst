-- Migration: Update company_research table for per-vector research
-- Description: Add research_type field to support multiple research vectors per company
-- Created: 2025-01-XX

-- Drop the unique constraint on company_id (we'll have multiple records per company)
ALTER TABLE company_research DROP CONSTRAINT IF EXISTS company_research_company_id_key;

-- Add research_type column
ALTER TABLE company_research ADD COLUMN IF NOT EXISTS research_type TEXT NOT NULL DEFAULT 'mission';

-- Create unique constraint on (company_id, research_type)
ALTER TABLE company_research ADD CONSTRAINT company_research_company_id_research_type_key 
  UNIQUE (company_id, research_type);

-- Update expires_at to be calculated (7 days from generated_at)
-- This will be handled in application code, but we can add a default
ALTER TABLE company_research ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '7 days');

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_research_company_type ON company_research(company_id, research_type);
CREATE INDEX IF NOT EXISTS idx_company_research_type ON company_research(research_type);

-- Add comment
COMMENT ON COLUMN company_research.research_type IS 'Type of research: mission, values, origin_story, product, user_types, competition, risks, recent_launches, strategy, funding, partnerships, customer_feedback, business_model';

