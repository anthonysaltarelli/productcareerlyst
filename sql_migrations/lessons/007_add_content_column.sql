-- Migration: Add content column for TipTap rich text content
-- Also makes video_url nullable to support text-only lessons

-- Add content column (JSONB to store TipTap JSON content)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content JSONB;

-- Make video_url nullable to support text-only lessons
ALTER TABLE lessons ALTER COLUMN video_url DROP NOT NULL;

-- Add comment explaining the content column format
COMMENT ON COLUMN lessons.content IS 'TipTap JSON content for lesson written material. Format: { type: "doc", content: [...] }';
