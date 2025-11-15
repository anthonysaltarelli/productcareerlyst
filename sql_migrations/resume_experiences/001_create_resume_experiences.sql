-- =====================================================
-- Resume Experiences Table
-- =====================================================
-- Stores work experience entries per resume version
-- Many experiences per version

-- Create table
CREATE TABLE IF NOT EXISTS resume_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT resume_experiences_title_not_empty CHECK (title != ''),
  CONSTRAINT resume_experiences_company_not_empty CHECK (company != '')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resume_experiences_version_id 
  ON resume_experiences(version_id);

CREATE INDEX IF NOT EXISTS idx_resume_experiences_version_order 
  ON resume_experiences(version_id, display_order);

-- Enable Row Level Security
ALTER TABLE resume_experiences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view experiences for their resume versions"
  ON resume_experiences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_experiences.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert experiences for their resume versions"
  ON resume_experiences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_experiences.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update experiences for their resume versions"
  ON resume_experiences FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_experiences.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete experiences for their resume versions"
  ON resume_experiences FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_experiences.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_resume_experiences_updated_at
  BEFORE UPDATE ON resume_experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

