-- =====================================================
-- Add Analysis Data Column to Resume Experience Bullets
-- =====================================================
-- Adds JSONB column to store AI analysis results including:
-- - Current analysis (latest scores, feedback, improved versions)
-- - Score history (array of previous scores with timestamps)
-- - Vector scores (clarity, impact, action, quantification)
-- - Overall grade
-- - Feedback descriptions
-- - Improved suggestions

-- Add analysis_data column
ALTER TABLE resume_experience_bullets
ADD COLUMN IF NOT EXISTS analysis_data JSONB DEFAULT NULL;

-- Create index for JSONB queries (useful for filtering by score ranges, etc.)
CREATE INDEX IF NOT EXISTS idx_resume_experience_bullets_analysis_data 
ON resume_experience_bullets USING GIN (analysis_data);

-- Add comment explaining the structure
COMMENT ON COLUMN resume_experience_bullets.analysis_data IS 
'JSONB column storing AI analysis results. Structure:
{
  "currentAnalysis": {
    "overallScore": number (0-100),
    "grade": string (F to A+),
    "vectors": {
      "clarity": { "score": number, "feedback": string },
      "impact": { "score": number, "feedback": string },
      "action": { "score": number, "feedback": string },
      "quantification": { "score": number, "feedback": string }
    },
    "improvedVersions": string[] (2-3 alternatives),
    "analyzedAt": string (ISO timestamp)
  },
  "scoreHistory": [
    {
      "score": number,
      "timestamp": string (ISO timestamp),
      "contentSnapshot": string
    }
  ]
}';


