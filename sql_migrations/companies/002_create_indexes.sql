-- Migration: Create indexes for companies table
-- Description: Indexes for query optimization
-- Created: 2025-11-15

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_is_approved ON companies(is_approved);
CREATE INDEX IF NOT EXISTS idx_companies_created_by_user ON companies(created_by_user_id);

