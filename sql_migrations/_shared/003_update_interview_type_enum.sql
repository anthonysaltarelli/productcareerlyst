-- Migration: Update interview_type enum with new values
-- Description: Replace old interview types with new PM-specific types
-- Created: 2025-01-27

-- Step 1: Create new enum with updated values
CREATE TYPE interview_type_new AS ENUM (
  'recruiter_screen',
  'hiring_manager_screen',
  'product_sense',
  'product_analytics_execution',
  'system_design',
  'technical',
  'product_strategy',
  'estimation',
  'executive',
  'cross_functional'
);

-- Step 2: Update the interviews table to use the new enum
-- First, we need to handle existing data - map old values to new ones
ALTER TABLE interviews
  ALTER COLUMN type TYPE interview_type_new
  USING CASE
    WHEN type::text = 'recruiter_screen' THEN 'recruiter_screen'::interview_type_new
    WHEN type::text = 'phone_screen' THEN 'recruiter_screen'::interview_type_new
    WHEN type::text = 'technical' THEN 'technical'::interview_type_new
    WHEN type::text = 'behavioral' THEN 'product_sense'::interview_type_new
    WHEN type::text = 'system_design' THEN 'system_design'::interview_type_new
    WHEN type::text = 'onsite' THEN 'cross_functional'::interview_type_new
    WHEN type::text = 'final' THEN 'executive'::interview_type_new
    WHEN type::text = 'other' THEN 'product_sense'::interview_type_new
    ELSE NULL
  END;

-- Step 3: Drop the old enum
DROP TYPE interview_type;

-- Step 4: Rename the new enum to the original name
ALTER TYPE interview_type_new RENAME TO interview_type;

-- Add comment
COMMENT ON TYPE interview_type IS 'Type of interview round - PM-specific interview types';

