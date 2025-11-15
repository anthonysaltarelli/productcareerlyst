-- =====================================================
-- Resume Contact Info Table
-- =====================================================
-- Stores contact information per resume version
-- One contact info per version

-- Create table
CREATE TABLE IF NOT EXISTS resume_contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  location VARCHAR(255),
  linkedin VARCHAR(255),
  portfolio VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT resume_contact_info_name_not_empty CHECK (full_name != ''),
  CONSTRAINT resume_contact_info_email_not_empty CHECK (email != ''),
  UNIQUE(version_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resume_contact_info_version_id 
  ON resume_contact_info(version_id);

-- Enable Row Level Security
ALTER TABLE resume_contact_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view contact info for their resume versions"
  ON resume_contact_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_contact_info.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contact info for their resume versions"
  ON resume_contact_info FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_contact_info.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contact info for their resume versions"
  ON resume_contact_info FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_contact_info.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contact info for their resume versions"
  ON resume_contact_info FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_contact_info.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_resume_contact_info_updated_at
  BEFORE UPDATE ON resume_contact_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

