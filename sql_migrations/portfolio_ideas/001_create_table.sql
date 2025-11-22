-- Migration: Create portfolio_ideas table
-- Description: Stores generated case study ideas for portfolio requests
-- Created: 2025-01-XX

CREATE TABLE IF NOT EXISTS portfolio_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES portfolio_idea_requests(id) ON DELETE CASCADE,
  idea_number INTEGER NOT NULL CHECK (idea_number >= 1 AND idea_number <= 3),
  company_name TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  user_segment JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, idea_number)
);

-- Add comments
COMMENT ON TABLE portfolio_ideas IS 'Generated case study ideas for portfolio requests';
COMMENT ON COLUMN portfolio_ideas.idea_number IS 'Which of the 3 ideas this is (1, 2, or 3)';
COMMENT ON COLUMN portfolio_ideas.company_name IS 'The well-known company/product for this case study';
COMMENT ON COLUMN portfolio_ideas.problem_description IS 'The specific problem that exists for this company';
COMMENT ON COLUMN portfolio_ideas.hypothesis IS 'The hypothesis in "If ___, then ___" format';
COMMENT ON COLUMN portfolio_ideas.user_segment IS 'JSON object describing the target user segment';

