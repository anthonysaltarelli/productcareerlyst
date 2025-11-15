-- =====================================================
-- Resume Education Table
-- =====================================================
-- Stores education entries per resume version
-- Many education entries per version

-- Create table
CREATE TABLE IF NOT EXISTS resume_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
  school VARCHAR(255) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  field VARCHAR(255),
  location VARCHAR(255),
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  gpa VARCHAR(20),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT resume_education_school_not_empty CHECK (school != ''),
  CONSTRAINT resume_education_degree_not_empty CHECK (degree != '')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resume_education_version_id 
  ON resume_education(version_id);

CREATE INDEX IF NOT EXISTS idx_resume_education_version_order 
  ON resume_education(version_id, display_order);

-- Enable Row Level Security
ALTER TABLE resume_education ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view education for their resume versions"
  ON resume_education FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_education.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert education for their resume versions"
  ON resume_education FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_education.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update education for their resume versions"
  ON resume_education FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_education.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete education for their resume versions"
  ON resume_education FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_education.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_resume_education_updated_at
  BEFORE UPDATE ON resume_education
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

