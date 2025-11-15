-- =====================================================
-- Resume Versions Table
-- =====================================================
-- Stores resume version metadata (Master, Google PM, etc.)
-- Each user can have multiple versions, but only one master

-- Create table
CREATE TABLE IF NOT EXISTS resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  is_master BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT resume_versions_name_not_empty CHECK (name != ''),
  CONSTRAINT resume_versions_slug_not_empty CHECK (slug != ''),
  UNIQUE(user_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id 
  ON resume_versions(user_id);

CREATE INDEX IF NOT EXISTS idx_resume_versions_user_slug 
  ON resume_versions(user_id, slug);

-- Ensure only one master per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_master_per_user 
  ON resume_versions(user_id) 
  WHERE is_master = true;

-- Enable Row Level Security
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own resume versions"
  ON resume_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resume versions"
  ON resume_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume versions"
  ON resume_versions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume versions"
  ON resume_versions FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_resume_versions_updated_at
  BEFORE UPDATE ON resume_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

