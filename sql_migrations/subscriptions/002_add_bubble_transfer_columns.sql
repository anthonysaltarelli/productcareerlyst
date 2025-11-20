-- Migration: Add Bubble transfer columns to subscriptions table
-- Description: Adds columns to track subscriptions transferred from Bubble
-- Created: 2025-01-16

-- Add transferred_from_bubble column
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS transferred_from_bubble BOOLEAN DEFAULT false;

-- Add transferred_at column
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN subscriptions.transferred_from_bubble IS 'Whether this subscription was transferred from Bubble';
COMMENT ON COLUMN subscriptions.transferred_at IS 'When the subscription was transferred from Bubble';

