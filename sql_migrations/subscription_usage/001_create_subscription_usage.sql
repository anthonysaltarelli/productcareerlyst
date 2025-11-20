-- Migration: Create subscription_usage table
-- Description: Tracks feature usage per user per month for plan limits
-- Created: 2025-01-16

-- Feature type enum
CREATE TYPE feature_type AS ENUM (
  'pm_emails_discovered',
  'outreach_messages_created',
  'resume_bullet_optimizations',
  'resume_customizations_for_jobs',
  'product_portfolio_case_study_ideas',
  'jobs_tracked',
  'custom_questions_for_interviewers',
  'automated_company_research_searches'
);

-- Create subscription_usage table
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type feature_type NOT NULL,
  month_year TEXT NOT NULL, -- Format: "YYYY-MM" e.g., "2025-01"
  usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_type, month_year)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_feature_type ON subscription_usage(feature_type);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_month_year ON subscription_usage(month_year);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_feature_month ON subscription_usage(user_id, feature_type, month_year);

-- Enable Row Level Security
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage"
  ON subscription_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON subscription_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON subscription_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all usage"
  ON subscription_usage FOR ALL
  USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE TRIGGER update_subscription_usage_updated_at
  BEFORE UPDATE ON subscription_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE subscription_usage IS 'Tracks feature usage per user per month for plan limit enforcement';
COMMENT ON COLUMN subscription_usage.feature_type IS 'Type of feature being tracked';
COMMENT ON COLUMN subscription_usage.month_year IS 'Month and year in format YYYY-MM (e.g., "2025-01")';
COMMENT ON COLUMN subscription_usage.usage_count IS 'Number of times this feature was used this month';

