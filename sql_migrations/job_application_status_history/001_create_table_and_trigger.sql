-- =====================================================
-- Job Application Status History Table
-- Tracks status changes for job applications over time
-- =====================================================

-- Create the status history table
CREATE TABLE job_application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_status application_status,  -- NULL for initial creation
  new_status application_status NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE job_application_status_history IS 'Tracks status changes for job applications over time';
COMMENT ON COLUMN job_application_status_history.old_status IS 'Previous status (NULL for initial creation)';
COMMENT ON COLUMN job_application_status_history.new_status IS 'New status after the change';
COMMENT ON COLUMN job_application_status_history.changed_at IS 'When the status change occurred';

-- Indexes for fast lookups
CREATE INDEX idx_status_history_application ON job_application_status_history(application_id);
CREATE INDEX idx_status_history_user ON job_application_status_history(user_id);
CREATE INDEX idx_status_history_changed_at ON job_application_status_history(changed_at DESC);

-- Enable RLS
ALTER TABLE job_application_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies (users can only see their own history)
CREATE POLICY "Users can view own status history" ON job_application_status_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own status history" ON job_application_status_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger function to auto-log status changes
CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log on INSERT (new application) or UPDATE when status changes
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO job_application_status_history (application_id, user_id, old_status, new_status, changed_at)
    VALUES (NEW.id, NEW.user_id, NULL, NEW.status, COALESCE(NEW.created_at, now()));
  ELSIF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO job_application_status_history (application_id, user_id, old_status, new_status, changed_at)
    VALUES (NEW.id, NEW.user_id, OLD.status, NEW.status, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to job_applications table
CREATE TRIGGER track_job_status_changes
  AFTER INSERT OR UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION log_job_status_change();

-- Backfill existing job applications with their current status
-- Using created_at as the initial status change time
INSERT INTO job_application_status_history (application_id, user_id, old_status, new_status, changed_at)
SELECT 
  id as application_id,
  user_id,
  NULL as old_status,
  status as new_status,
  created_at as changed_at
FROM job_applications;

