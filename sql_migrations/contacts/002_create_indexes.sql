-- Migration: Create indexes for contacts table
-- Description: Indexes for query optimization
-- Created: 2025-11-15

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_application_id ON contacts(application_id);
CREATE INDEX IF NOT EXISTS idx_contacts_relationship ON contacts(relationship);
CREATE INDEX IF NOT EXISTS idx_contacts_user_company ON contacts(user_id, company_id);

