-- Migration: Make Airbnb research records stale for testing
-- Description: Update generated_at and expires_at to be more than 7 days old
-- Created: 2025-01-XX

-- Update all research records for Airbnb to be 8 days old
UPDATE company_research
SET 
  generated_at = NOW() - INTERVAL '8 days',
  expires_at = NOW() - INTERVAL '1 day',
  updated_at = NOW()
WHERE company_id IN (
  SELECT id FROM companies WHERE LOWER(name) LIKE '%airbnb%'
);

-- Verify the update
SELECT 
  c.name,
  cr.research_type,
  cr.generated_at,
  cr.expires_at,
  NOW() - cr.generated_at AS age
FROM company_research cr
JOIN companies c ON c.id = cr.company_id
WHERE LOWER(c.name) LIKE '%airbnb%'
ORDER BY cr.research_type;

