-- Migration: Create nps_email_sends table
-- Description: Tracks NPS email sends to users, including delivery status from Resend
-- Created: 2025-01-XX

CREATE TABLE IF NOT EXISTS nps_email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  resend_email_id TEXT, -- Resend API email ID for tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'sent', 'failed', 'pending'
  error_message TEXT, -- Error details if status is 'failed'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nps_email_sends_user_id ON nps_email_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_nps_email_sends_email ON nps_email_sends(email);
CREATE INDEX IF NOT EXISTS idx_nps_email_sends_status ON nps_email_sends(status);
CREATE INDEX IF NOT EXISTS idx_nps_email_sends_sent_at ON nps_email_sends(sent_at);
CREATE INDEX IF NOT EXISTS idx_nps_email_sends_resend_email_id ON nps_email_sends(resend_email_id);

-- Enable RLS
ALTER TABLE nps_email_sends ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE nps_email_sends IS 'Tracks NPS email sends to users, including delivery status from Resend';
COMMENT ON COLUMN nps_email_sends.user_id IS 'User ID who received the email';
COMMENT ON COLUMN nps_email_sends.email IS 'Recipient email address';
COMMENT ON COLUMN nps_email_sends.resend_email_id IS 'Resend API email ID for tracking delivery status';
COMMENT ON COLUMN nps_email_sends.status IS 'Email send status: sent, failed, pending';
COMMENT ON COLUMN nps_email_sends.error_message IS 'Error details if email send failed';

