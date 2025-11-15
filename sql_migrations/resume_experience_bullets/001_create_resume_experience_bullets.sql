-- =====================================================
-- Resume Experience Bullets Table
-- =====================================================
-- Stores bullet points for each experience entry
-- Many bullets per experience

-- Create table
CREATE TABLE IF NOT EXISTS resume_experience_bullets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES resume_experiences(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_selected BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT resume_experience_bullets_content_not_empty CHECK (content != '')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resume_experience_bullets_experience_id 
  ON resume_experience_bullets(experience_id);

CREATE INDEX IF NOT EXISTS idx_resume_experience_bullets_experience_order 
  ON resume_experience_bullets(experience_id, display_order);

CREATE INDEX IF NOT EXISTS idx_resume_experience_bullets_selected 
  ON resume_experience_bullets(experience_id, is_selected);

-- Enable Row Level Security
ALTER TABLE resume_experience_bullets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view bullets for their resume experiences"
  ON resume_experience_bullets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resume_experiences
      JOIN resume_versions ON resume_versions.id = resume_experiences.version_id
      WHERE resume_experiences.id = resume_experience_bullets.experience_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert bullets for their resume experiences"
  ON resume_experience_bullets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resume_experiences
      JOIN resume_versions ON resume_versions.id = resume_experiences.version_id
      WHERE resume_experiences.id = resume_experience_bullets.experience_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update bullets for their resume experiences"
  ON resume_experience_bullets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM resume_experiences
      JOIN resume_versions ON resume_versions.id = resume_experiences.version_id
      WHERE resume_experiences.id = resume_experience_bullets.experience_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete bullets for their resume experiences"
  ON resume_experience_bullets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM resume_experiences
      JOIN resume_versions ON resume_versions.id = resume_experiences.version_id
      WHERE resume_experiences.id = resume_experience_bullets.experience_id
      AND resume_versions.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_resume_experience_bullets_updated_at
  BEFORE UPDATE ON resume_experience_bullets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

