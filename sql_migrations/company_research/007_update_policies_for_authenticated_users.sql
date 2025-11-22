-- Migration: Update RLS policies for company_research table
-- Description: Allow authenticated users to insert/update research (shared data)
-- Created: 2025-01-XX

-- Drop existing insert/update policies
DROP POLICY IF EXISTS "Only service role can insert company research" ON company_research;
DROP POLICY IF EXISTS "Only service role can update company research" ON company_research;

-- Policy: Authenticated users can insert research (shared across all users)
CREATE POLICY "Authenticated users can insert company research"
  ON company_research FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update research (shared across all users)
CREATE POLICY "Authenticated users can update company research"
  ON company_research FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Keep delete policy as service role only (for safety)
-- DELETE policy remains: Only service role can delete company research

