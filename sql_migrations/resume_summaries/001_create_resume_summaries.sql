-- =====================================================
-- Resume Summaries Table
-- =====================================================
-- Stores professional summary per resume version
-- One summary per version

-- Create table
CREATE TABLE IF NOT EXISTS resume_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT resume_summaries_content_not_empty CHECK (content != ''),
  UNIQUE(version_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resume_summaries_version_id 
  ON resume_summaries(version_id);

-- Enable Row Level Security
ALTER TABLE resume_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view summaries for their resume versions"
  ON resume_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_summaries.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert summaries for their resume versions"
  ON resume_summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_summaries.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update summaries for their resume versions"
  ON resume_summaries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_summaries.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete summaries for their resume versions"
  ON resume_summaries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_summaries.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_resume_summaries_updated_at
  BEFORE UPDATE ON resume_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

