-- Migration: Add function for slug availability checking
-- This function bypasses RLS to check if a slug is already taken across ALL portfolios
-- It only returns boolean/id, not sensitive portfolio data.

-- Drop the function if it exists (for idempotency)
DROP FUNCTION IF EXISTS check_portfolio_slug_available(text, uuid);

-- Create a function that checks if a portfolio slug is available
-- SECURITY DEFINER means it runs with the permissions of the function owner (postgres)
-- This allows it to bypass RLS policies and see all portfolios
CREATE OR REPLACE FUNCTION check_portfolio_slug_available(
  p_slug text,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  available boolean,
  owner_user_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN p.id IS NULL THEN true  -- No portfolio with this slug exists
      WHEN p.user_id = p_user_id THEN true  -- User owns this portfolio (can update their own slug)
      ELSE false  -- Another user owns this slug
    END as available,
    p.user_id as owner_user_id
  FROM (SELECT 1) AS dummy
  LEFT JOIN portfolios p ON p.slug = lower(p_slug);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_portfolio_slug_available(text, uuid) TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION check_portfolio_slug_available IS 
  'Checks if a portfolio slug is available. Bypasses RLS to see all portfolios. 
   Returns available=true if slug is not taken, or if the current user owns it.';






