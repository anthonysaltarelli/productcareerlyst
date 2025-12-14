-- Add user feedback fields to mock_interviews table
-- This migration was applied via Supabase MCP on 2024-12-14

ALTER TABLE mock_interviews
ADD COLUMN IF NOT EXISTS call_quality_rating INTEGER CHECK (call_quality_rating >= 1 AND call_quality_rating <= 5),
ADD COLUMN IF NOT EXISTS call_quality_feedback TEXT,
ADD COLUMN IF NOT EXISTS self_performance_rating INTEGER CHECK (self_performance_rating >= 1 AND self_performance_rating <= 5),
ADD COLUMN IF NOT EXISTS self_performance_notes TEXT;
