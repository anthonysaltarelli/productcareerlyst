-- Migration: Create subscriptions table
-- Description: Stores user subscription information from Stripe
-- Created: 2025-01-16

-- Subscription plan enum
CREATE TYPE subscription_plan AS ENUM (
  'learn',
  'accelerate'
);

-- Subscription status enum (matches Stripe subscription statuses)
CREATE TYPE subscription_status AS ENUM (
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'trialing',
  'unpaid',
  'paused'
);

-- Billing cadence enum
CREATE TYPE billing_cadence AS ENUM (
  'monthly',
  'quarterly',
  'yearly'
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  plan subscription_plan NOT NULL,
  billing_cadence billing_cadence NOT NULL,
  status subscription_status NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  stripe_price_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT subscriptions_user_id_stripe_customer_unique UNIQUE(user_id, stripe_customer_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE subscriptions IS 'User subscription information synced from Stripe';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID (unique)';
COMMENT ON COLUMN subscriptions.plan IS 'Subscription plan type (learn or accelerate)';
COMMENT ON COLUMN subscriptions.billing_cadence IS 'Billing frequency (monthly, quarterly, yearly)';
COMMENT ON COLUMN subscriptions.status IS 'Current subscription status from Stripe';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at period end';
COMMENT ON COLUMN subscriptions.stripe_price_id IS 'Stripe price ID for this subscription';

