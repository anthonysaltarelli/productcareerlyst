-- Migration: Create indexes for company_research table
-- Description: Indexes for query optimization
-- Created: 2025-11-15

CREATE INDEX IF NOT EXISTS idx_company_research_company_id ON company_research(company_id);
CREATE INDEX IF NOT EXISTS idx_company_research_expires_at ON company_research(expires_at);

