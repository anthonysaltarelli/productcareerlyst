-- Migration: Create contact_interactions table
-- Description: Communication history with contacts (private per user)
-- Created: 2025-11-15

CREATE TABLE IF NOT EXISTS contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type interaction_type,
  summary TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE contact_interactions IS 'Communication history with contacts (private per user)';
COMMENT ON COLUMN contact_interactions.type IS 'Type of interaction (email, linkedin, phone, coffee, etc.)';
COMMENT ON COLUMN contact_interactions.summary IS 'Brief summary of the interaction';

