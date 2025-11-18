-- Migration: Create triggers for resume_analysis_usage table
-- Description: Automatic updated_at timestamp
-- Created: 2025-01-16

CREATE TRIGGER update_resume_analysis_usage_updated_at
  BEFORE UPDATE ON resume_analysis_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

