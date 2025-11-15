-- Migration: Create RLS policies for companies table
-- Description: All authenticated users can read and create, only admins can update
-- Created: 2025-11-15

-- Policy: All authenticated users can view all companies
CREATE POLICY "Companies are viewable by all authenticated users"
  ON companies FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert companies (pending approval)
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only service role (admin) can update companies
-- Note: In production, you may want to create a custom admin role check
CREATE POLICY "Only admins can update companies"
  ON companies FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role');

-- Policy: Only service role (admin) can delete companies
CREATE POLICY "Only admins can delete companies"
  ON companies FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role');

