-- Migration: Create indexes for contact_interactions table
-- Description: Indexes for query optimization
-- Created: 2025-11-15

CREATE INDEX IF NOT EXISTS idx_contact_interactions_user_id ON contact_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_contact_id ON contact_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_date ON contact_interactions(date);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_user_contact ON contact_interactions(user_id, contact_id);

