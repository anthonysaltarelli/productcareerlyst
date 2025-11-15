-- Migration: Create triggers for job_applications table
-- Description: Auto-update timestamps
-- Created: 2025-11-15

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

