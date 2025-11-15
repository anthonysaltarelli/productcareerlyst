-- =====================================================
-- Resume Styles Table
-- =====================================================
-- Stores styling/formatting preferences per resume version
-- One style configuration per version

-- Create table
CREATE TABLE IF NOT EXISTS resume_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
  
  -- Font settings
  font_family VARCHAR(100) DEFAULT 'Arial',
  font_size INTEGER DEFAULT 11,
  line_height DECIMAL(3,2) DEFAULT 1.15,
  
  -- Margins (in inches)
  margin_top DECIMAL(3,2) DEFAULT 0.5,
  margin_bottom DECIMAL(3,2) DEFAULT 0.5,
  margin_left DECIMAL(3,2) DEFAULT 0.75,
  margin_right DECIMAL(3,2) DEFAULT 0.75,
  
  -- Colors (hex format)
  accent_color VARCHAR(7) DEFAULT '#000000',
  heading_color VARCHAR(7) DEFAULT '#000000',
  text_color VARCHAR(7) DEFAULT '#000000',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT resume_styles_font_size_valid CHECK (font_size >= 8 AND font_size <= 16),
  CONSTRAINT resume_styles_line_height_valid CHECK (line_height >= 0.5 AND line_height <= 3.0),
  CONSTRAINT resume_styles_margins_valid CHECK (
    margin_top >= 0 AND margin_top <= 2 AND
    margin_bottom >= 0 AND margin_bottom <= 2 AND
    margin_left >= 0 AND margin_left <= 2 AND
    margin_right >= 0 AND margin_right <= 2
  ),
  UNIQUE(version_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resume_styles_version_id 
  ON resume_styles(version_id);

-- Enable Row Level Security
ALTER TABLE resume_styles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view styles for their resume versions"
  ON resume_styles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_styles.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert styles for their resume versions"
  ON resume_styles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_styles.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update styles for their resume versions"
  ON resume_styles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_styles.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete styles for their resume versions"
  ON resume_styles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM resume_versions
      WHERE resume_versions.id = resume_styles.version_id
      AND resume_versions.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_resume_styles_updated_at
  BEFORE UPDATE ON resume_styles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

