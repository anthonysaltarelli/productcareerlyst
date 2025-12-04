-- Migration: Enable RLS policies for nps_email_sends table
-- Description: Only admins can view all email sends, users can view their own
-- Created: 2025-01-XX

-- Policy: Admins can view all email sends
CREATE POLICY "Admins can view all nps_email_sends"
  ON nps_email_sends
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policy: Admins can insert email sends
CREATE POLICY "Admins can insert nps_email_sends"
  ON nps_email_sends
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policy: Admins can update email sends
CREATE POLICY "Admins can update nps_email_sends"
  ON nps_email_sends
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

