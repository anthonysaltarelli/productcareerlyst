-- Query: Onboarding Completion Rate Per Day
-- Description: Tracks onboarding completion rate per day, filtering out users with emails containing 'anth'
-- Usage: Run this query to get daily onboarding completion metrics
-- 
-- This query shows:
-- - Users who started onboarding on each day (based on created_at)
-- - Users who started on that day and eventually completed (regardless of completion date)
-- - Completion rate = (completed / started) * 100

SELECT 
  DATE(op.created_at) AS date,
  COUNT(DISTINCT op.user_id) AS users_started,
  COUNT(DISTINCT CASE WHEN op.is_complete = true THEN op.user_id END) AS users_completed,
  ROUND(
    COUNT(DISTINCT CASE WHEN op.is_complete = true THEN op.user_id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT op.user_id), 0) * 100, 
    2
  ) AS completion_rate_percent
FROM onboarding_progress op
INNER JOIN auth.users u ON op.user_id = u.id
WHERE LOWER(u.email) NOT LIKE '%anth%'
GROUP BY DATE(op.created_at)
ORDER BY DATE(op.created_at) DESC;

