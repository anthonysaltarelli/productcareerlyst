-- Migration: Add 'scheduled' to email_event_type enum
-- Description: Adds 'scheduled' event type to track email.scheduled webhook events from Resend
-- Created: 2025-12-08

-- Add 'scheduled' to the email_event_type enum
ALTER TYPE email_event_type ADD VALUE IF NOT EXISTS 'scheduled';

-- Add comment
COMMENT ON TYPE email_event_type IS 'Email event types from Resend webhooks: sent, delivered, opened, clicked, bounced, complained, scheduled';


