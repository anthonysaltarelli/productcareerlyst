-- Query: Onboarding Diagnostic - Detailed Analysis
-- Description: Shows detailed onboarding metrics to diagnose completion rate issues
-- Usage: Run this to see when users started vs when they completed, and identify bottlenecks

-- 1. Users who started but haven't completed (potential drop-offs)
SELECT 
  'Users Started But Not Completed' AS metric_type,
  DATE(op.created_at) AS date,
  COUNT(DISTINCT op.user_id) AS count,
  STRING_AGG(DISTINCT u.email, ', ' ORDER BY u.email) AS user_emails
FROM onboarding_progress op
INNER JOIN auth.users u ON op.user_id = u.id
WHERE LOWER(u.email) NOT LIKE '%anth%'
  AND op.is_complete = false
GROUP BY DATE(op.created_at)
ORDER BY DATE(op.created_at) DESC
LIMIT 10;

-- 2. Time to complete analysis (how long it takes users to complete)
SELECT 
  'Time to Complete' AS metric_type,
  DATE(op.created_at) AS start_date,
  DATE(op.completed_at) AS completion_date,
  COUNT(DISTINCT op.user_id) AS users_completed,
  ROUND(AVG(EXTRACT(EPOCH FROM (op.completed_at - op.created_at)) / 3600), 2) AS avg_hours_to_complete,
  ROUND(MIN(EXTRACT(EPOCH FROM (op.completed_at - op.created_at)) / 3600), 2) AS min_hours_to_complete,
  ROUND(MAX(EXTRACT(EPOCH FROM (op.completed_at - op.created_at)) / 3600), 2) AS max_hours_to_complete
FROM onboarding_progress op
INNER JOIN auth.users u ON op.user_id = u.id
WHERE LOWER(u.email) NOT LIKE '%anth%'
  AND op.is_complete = true
  AND op.completed_at IS NOT NULL
GROUP BY DATE(op.created_at), DATE(op.completed_at)
ORDER BY start_date DESC, completion_date DESC
LIMIT 20;

-- 3. Current step analysis (where users are stuck)
SELECT 
  'Current Step Distribution' AS metric_type,
  op.current_step,
  COUNT(DISTINCT op.user_id) AS user_count,
  COUNT(DISTINCT CASE WHEN op.is_complete = true THEN op.user_id END) AS completed_count,
  COUNT(DISTINCT CASE WHEN op.is_complete = false THEN op.user_id END) AS in_progress_count
FROM onboarding_progress op
INNER JOIN auth.users u ON op.user_id = u.id
WHERE LOWER(u.email) NOT LIKE '%anth%'
GROUP BY op.current_step
ORDER BY user_count DESC;

-- 4. Recent users detail (last 7 days)
SELECT 
  'Recent Users Detail' AS metric_type,
  u.email,
  DATE(op.created_at) AS started_date,
  DATE(op.completed_at) AS completed_date,
  op.is_complete,
  op.current_step,
  op.completed_steps,
  CASE 
    WHEN op.is_complete = true THEN 'Completed'
    WHEN op.completed_at IS NULL AND op.current_step IS NOT NULL THEN 'In Progress'
    WHEN op.completed_at IS NULL AND op.current_step IS NULL THEN 'Not Started'
    ELSE 'Unknown'
  END AS status
FROM onboarding_progress op
INNER JOIN auth.users u ON op.user_id = u.id
WHERE LOWER(u.email) NOT LIKE '%anth%'
  AND op.created_at >= NOW() - INTERVAL '7 days'
ORDER BY op.created_at DESC;





