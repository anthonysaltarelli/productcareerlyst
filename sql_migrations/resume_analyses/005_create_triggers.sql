-- Migration: Create triggers for resume_analyses table
-- Description: Automatic updated_at timestamp
-- Created: 2025-01-16

CREATE TRIGGER update_resume_analyses_updated_at
  BEFORE UPDATE ON resume_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

