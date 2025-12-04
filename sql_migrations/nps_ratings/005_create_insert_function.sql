-- Migration: Create a function to insert ratings that bypasses RLS
-- Description: Allows unauthenticated inserts with any user_id string
-- Created: 2025-01-XX

-- Create function that can insert ratings (bypasses RLS for the function execution)
CREATE OR REPLACE FUNCTION insert_nps_rating(
  p_user_id TEXT,
  p_rating INTEGER,
  p_feedback TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id TEXT,
  rating INTEGER,
  feedback TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result RECORD;
  v_existing_id UUID;
BEGIN
  -- Check if rating exists (only if user_id is not null)
  IF p_user_id IS NOT NULL THEN
    SELECT public.nps_ratings.id INTO v_existing_id
    FROM public.nps_ratings
    WHERE public.nps_ratings.user_id = p_user_id
    LIMIT 1;
  END IF;
  
  IF v_existing_id IS NOT NULL THEN
    -- Update existing
    UPDATE public.nps_ratings
    SET 
      rating = p_rating,
      feedback = p_feedback,
      source = p_source,
      updated_at = NOW()
    WHERE public.nps_ratings.id = v_existing_id
    RETURNING * INTO v_result;
  ELSE
    -- Insert new
    INSERT INTO public.nps_ratings (user_id, rating, feedback, source)
    VALUES (p_user_id, p_rating, p_feedback, p_source)
    RETURNING * INTO v_result;
  END IF;
  
  -- Return the result
  RETURN QUERY SELECT 
    v_result.id,
    v_result.user_id,
    v_result.rating,
    v_result.feedback,
    v_result.source,
    v_result.created_at,
    v_result.updated_at;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION insert_nps_rating TO anon;
GRANT EXECUTE ON FUNCTION insert_nps_rating TO authenticated;

-- Add comment
COMMENT ON FUNCTION insert_nps_rating IS 'Insert or update NPS rating, bypassing RLS. Allows any user_id string.';

