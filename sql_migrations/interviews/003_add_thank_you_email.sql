-- Migration: Add thank you email fields to interviews table
-- Description: Store generated thank you email subject and body
-- Created: 2025-01-27

ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS thank_you_email_subject TEXT,
ADD COLUMN IF NOT EXISTS thank_you_email_body TEXT;

-- Add comments
COMMENT ON COLUMN interviews.thank_you_email_subject IS 'Subject line of the generated thank you email';
COMMENT ON COLUMN interviews.thank_you_email_body IS 'Body text of the generated thank you email';



