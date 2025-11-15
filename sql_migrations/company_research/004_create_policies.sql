-- Migration: Create RLS policies for company_research table
-- Description: All authenticated users can read, only system can write
-- Created: 2025-11-15

-- Policy: All authenticated users can view company research
CREATE POLICY "Company research is viewable by all authenticated users"
  ON company_research FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Only service role can insert/update research (via API)
CREATE POLICY "Only service role can insert company research"
  ON company_research FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can update company research"
  ON company_research FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can delete company research"
  ON company_research FOR DELETE
  USING (auth.role() = 'service_role');

