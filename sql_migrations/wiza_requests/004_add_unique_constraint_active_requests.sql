-- Migration: Add unique constraint to prevent duplicate active Wiza requests
-- Description: Creates a unique index on (user_id, company_id, application_id) for pending/processing status
-- This prevents multiple active requests for the same combination at the database level
-- Created: 2025-11-21

-- Create a unique constraint for pending/processing requests
-- This prevents multiple pending/processing requests for the same user/company/application
-- Once a request completes (status changes to completed/failed/no_contacts), a new one can be created
CREATE UNIQUE INDEX IF NOT EXISTS idx_wiza_requests_unique_active
ON wiza_requests (user_id, company_id, COALESCE(application_id, '00000000-0000-0000-0000-000000000000'::UUID))
WHERE status IN ('pending', 'processing');

-- Add comment
COMMENT ON INDEX idx_wiza_requests_unique_active IS 'Prevents duplicate pending/processing Wiza requests for the same user/company/application combination. Database-level enforcement prevents race conditions.';

