-- =====================================================
-- Resume Education Achievements Table
-- =====================================================
-- Stores achievements/honors for each education entry
-- Many achievements per education entry

-- Create table
CREATE TABLE IF NOT EXISTS resume_education_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  education_id UUID NOT NULL REFERENCES resume_education(id) ON DELETE CASCADE,
  achievement TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT resume_education_achievements_not_empty CHECK (achievement != '')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resume_education_achievements_education_id 
  ON resume_education_achievements(education_id);

CREATE INDEX IF NOT EXISTS idx_resume_education_achievements_education_order 
  ON resume_education_achievements(education_id, display_order);

-- Enable Row Level Security
ALTER TABLE resume_education_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view achievements for their education entries"
  ON resume_education_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resume_education
      JOIN resume_versions ON resume_versions.id = resume_education.version_id
      WHERE resume_education.id = resume_education_achievements.education_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert achievements for their education entries"
  ON resume_education_achievements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resume_education
      JOIN resume_versions ON resume_versions.id = resume_education.version_id
      WHERE resume_education.id = resume_education_achievements.education_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update achievements for their education entries"
  ON resume_education_achievements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM resume_education
      JOIN resume_versions ON resume_versions.id = resume_education.version_id
      WHERE resume_education.id = resume_education_achievements.education_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete achievements for their education entries"
  ON resume_education_achievements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM resume_education
      JOIN resume_versions ON resume_versions.id = resume_education.version_id
      WHERE resume_education.id = resume_education_achievements.education_id
      AND resume_versions.user_id = auth.uid()
    )
  );

