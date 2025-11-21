-- Migration: Add function to prevent duplicate Wiza requests using advisory locks
-- Description: Creates a database function that uses PostgreSQL session-level advisory locks to prevent race conditions
-- Created: 2025-11-21
-- Updated: 2025-11-21 - Replaced with create_or_get_wiza_request that does check-and-insert atomically

-- Create a function that atomically checks for duplicates and creates a reservation if none exists
-- This function uses session-level advisory locks to serialize requests for the same user/company/application
-- The lock persists until explicitly released, ensuring only one request proceeds at a time
CREATE OR REPLACE FUNCTION create_or_get_wiza_request(
  p_user_id UUID,
  p_company_id UUID,
  p_application_id UUID,
  p_search_name TEXT,
  p_search_type TEXT,
  p_max_profiles INTEGER,
  p_job_titles TEXT[],
  p_thirty_seconds_ago TIMESTAMPTZ
)
RETURNS TABLE(
  request_id UUID,
  wiza_list_id TEXT,
  status TEXT,
  wiza_status TEXT,
  is_new BOOLEAN
) AS $$
DECLARE
  v_lock_key BIGINT;
  v_existing RECORD;
  v_new_id UUID;
BEGIN
  -- Generate lock key from user_id, company_id, and application_id
  -- This ensures the same combination always gets the same lock
  v_lock_key := hashtext(p_user_id::TEXT)::BIGINT + 
                hashtext(p_company_id::TEXT)::BIGINT + 
                hashtext(COALESCE(p_application_id::TEXT, 'null'))::BIGINT;
  
  -- Acquire session-level advisory lock (not transaction-level)
  -- This will block other requests until we explicitly release it
  PERFORM pg_advisory_lock(v_lock_key);
  
  BEGIN
    -- Check for existing request while holding the lock
    -- Use table alias to avoid ambiguous column references
    -- FOR UPDATE locks the row to prevent concurrent modifications
    SELECT wr.id, wr.wiza_list_id, wr.status, wr.wiza_status
    INTO v_existing
    FROM wiza_requests wr
    WHERE wr.user_id = p_user_id
      AND wr.company_id = p_company_id
      AND (wr.application_id = p_application_id OR (wr.application_id IS NULL AND p_application_id IS NULL))
      AND wr.status IN ('pending', 'processing')
      AND wr.created_at >= p_thirty_seconds_ago
    ORDER BY wr.created_at DESC
    LIMIT 1
    FOR UPDATE; -- Lock the row
    
    -- If existing found, return it
    IF v_existing IS NOT NULL THEN
      PERFORM pg_advisory_unlock(v_lock_key);
      RETURN QUERY SELECT 
        v_existing.id,
        v_existing.wiza_list_id,
        v_existing.status,
        v_existing.wiza_status,
        FALSE; -- Not new
    ELSE
      -- No existing, create new reservation record
      INSERT INTO wiza_requests (
        user_id,
        company_id,
        application_id,
        search_name,
        search_type,
        max_profiles,
        job_titles,
        status,
        wiza_status,
        wiza_list_id
      ) VALUES (
        p_user_id,
        p_company_id,
        p_application_id,
        p_search_name,
        p_search_type,
        p_max_profiles,
        p_job_titles,
        'pending',
        'queued',
        NULL
      )
      RETURNING id INTO v_new_id;
      
      PERFORM pg_advisory_unlock(v_lock_key);
      
      -- Return new reservation
      RETURN QUERY SELECT 
        v_new_id,
        NULL::TEXT,
        'pending',
        'queued',
        TRUE; -- Is new
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM pg_advisory_unlock(v_lock_key);
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users (required for Supabase RPC)
GRANT EXECUTE ON FUNCTION create_or_get_wiza_request(UUID, UUID, UUID, TEXT, TEXT, INTEGER, TEXT[], TIMESTAMPTZ) TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_or_get_wiza_request IS 'Atomically checks for duplicate Wiza requests and creates a reservation if none exists. Uses session-level advisory locks to prevent race conditions. Returns existing request if found within last 30 seconds, otherwise creates and returns new reservation.';

