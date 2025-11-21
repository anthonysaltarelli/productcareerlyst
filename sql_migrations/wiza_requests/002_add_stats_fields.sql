-- Migration: Add stats/outcome fields to wiza_requests table
-- Description: Store detailed outcome statistics from Wiza API when list is finished
-- Created: 2025-11-21

-- Add stats fields to track outcome details
ALTER TABLE wiza_requests
  ADD COLUMN IF NOT EXISTS stats_people_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_valid_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_risky_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_unfound_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_duplicate_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_emails_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stats_phones_count INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN wiza_requests.stats_people_count IS 'Total number of people found in the list';
COMMENT ON COLUMN wiza_requests.stats_valid_count IS 'Number of contacts with valid email addresses';
COMMENT ON COLUMN wiza_requests.stats_risky_count IS 'Number of contacts with risky email addresses';
COMMENT ON COLUMN wiza_requests.stats_unfound_count IS 'Number of contacts where email could not be found';
COMMENT ON COLUMN wiza_requests.stats_duplicate_count IS 'Number of duplicate contacts';
COMMENT ON COLUMN wiza_requests.stats_emails_count IS 'Total number of email addresses found';
COMMENT ON COLUMN wiza_requests.stats_phones_count IS 'Total number of phone numbers found';

-- Update existing comment for status to clarify the distinction
COMMENT ON COLUMN wiza_requests.status IS 'Internal business status: pending, processing, completed, failed, no_contacts';
COMMENT ON COLUMN wiza_requests.wiza_status IS 'Raw status from Wiza API: queued, scraping, resolving, finished, failed';

