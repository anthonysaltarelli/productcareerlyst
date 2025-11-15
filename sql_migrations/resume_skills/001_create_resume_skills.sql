-- =====================================================
-- Resume Skills Table
-- =====================================================
-- Stores skills per resume version organized by category
-- Many skills per version

-- Create table
CREATE TABLE IF NOT EXISTS resume_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  skill_name VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT resume_skills_category_not_empty CHECK (category != ''),
  CONSTRAINT resume_skills_name_not_empty CHECK (skill_name != ''),
  CONSTRAINT resume_skills_valid_category CHECK (
    category IN ('technical', 'product', 'soft')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resume_skills_version_id 
  ON resume_skills(version_id);

CREATE INDEX IF NOT EXISTS idx_resume_skills_version_category 
  ON resume_skills(version_id, category);

CREATE INDEX IF NOT EXISTS idx_resume_skills_version_category_order 
  ON resume_skills(version_id, category, display_order);

-- Enable Row Level Security
ALTER TABLE resume_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view skills for their resume versions"
  ON resume_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_skills.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert skills for their resume versions"
  ON resume_skills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_skills.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update skills for their resume versions"
  ON resume_skills FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_skills.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete skills for their resume versions"
  ON resume_skills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_skills.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_resume_skills_updated_at
  BEFORE UPDATE ON resume_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

