-- Migration: Create triggers for interview_questions table
-- Description: Auto-update timestamps
-- Created: 2025-11-15

CREATE TRIGGER update_interview_questions_updated_at
  BEFORE UPDATE ON interview_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

