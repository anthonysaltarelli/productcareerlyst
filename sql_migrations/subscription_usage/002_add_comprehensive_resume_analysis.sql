-- Migration: Add comprehensive_resume_analysis to feature_type enum
-- Description: Adds the new comprehensive_resume_analysis feature type to the enum
-- Created: 2025-11-22

-- Add new enum value
ALTER TYPE feature_type ADD VALUE IF NOT EXISTS 'comprehensive_resume_analysis';

-- Add comment
COMMENT ON TYPE feature_type IS 'Feature types that can be tracked for usage limits';

