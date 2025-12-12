# Trial Conversion Analysis

## Overview

This document provides analysis of trial-to-paid subscription conversion rates, excluding bubble transfer users.

## Methodology

The analysis:
1. Identifies all users who had a trial subscription (status = 'trialing' OR trial_start IS NOT NULL)
2. Excludes bubble transfer users (users with matched_user_id in bubble_users table OR transferred_from_bubble = true)
3. Determines conversion by checking if user has an active subscription that started after their trial ended
4. Calculates conversion rate: (converted users / total trial users) × 100

## Current Results (as of latest analysis)

### Overall Metrics

- **Total Trial Users** (excluding bubble transfers): **57**
- **Converted Users**: **5**
- **Not Converted**: **52**
- **Conversion Rate**: **8.77%**

### Conversion by Plan

- **Converted to Learn**: 0
- **Converted to Accelerate**: 5

### Status Breakdown (Non-Converted Users)

- **Currently Trialing**: 38
- **Canceled**: 13
- **Past Due**: 1
- **Other Status**: 0

## Key Insights

1. **Low Conversion Rate**: 8.77% conversion rate indicates significant room for improvement in trial-to-paid conversion.

2. **All Conversions to Accelerate**: All 5 converted users chose the Accelerate plan, suggesting:
   - Accelerate plan positioning is effective for trial users
   - Learn plan may need better positioning or trial experience
   - Trial experience may be more aligned with Accelerate features

3. **High Trial Activity**: 38 users are still in trial, representing potential future conversions.

4. **Cancellation Rate**: 13 users canceled after trial, representing 22.8% of trial users.

## Recommendations

1. **Improve Trial Experience**: Focus on demonstrating value during trial period
2. **Trial-to-Paid Nurture**: Implement targeted email sequences for users approaching trial end
3. **Learn Plan Positioning**: Investigate why no users converted to Learn plan
4. **Conversion Optimization**: A/B test trial length, features, and pricing presentation

## Running the Analysis

To run this analysis yourself, use the Supabase MCP tool with the following query:

```sql
WITH bubble_transfer_users AS (
  SELECT DISTINCT matched_user_id as user_id
  FROM bubble_users
  WHERE matched_user_id IS NOT NULL
),
trial_users AS (
  SELECT DISTINCT 
    s.user_id,
    MIN(s.trial_start) as first_trial_start,
    MAX(s.trial_end) as last_trial_end,
    MAX(CASE WHEN s.status = 'trialing' THEN s.updated_at END) as last_trialing_date
  FROM subscriptions s
  WHERE (s.status = 'trialing' OR s.trial_start IS NOT NULL)
    AND NOT EXISTS (
      SELECT 1 FROM bubble_transfer_users btu WHERE btu.user_id = s.user_id
    )
    AND (s.transferred_from_bubble IS NULL OR s.transferred_from_bubble = false)
  GROUP BY s.user_id
),
user_subscription_status AS (
  SELECT 
    tu.user_id,
    tu.first_trial_start,
    tu.last_trial_end,
    tu.last_trialing_date,
    MAX(CASE WHEN s.status = 'active' THEN s.current_period_start END) as latest_active_start,
    MAX(CASE WHEN s.status = 'active' THEN s.plan END) as active_plan,
    MAX(CASE WHEN s.status = 'active' THEN s.billing_cadence END) as active_billing_cadence,
    ARRAY_AGG(DISTINCT s.status) FILTER (WHERE s.status IS NOT NULL) as all_statuses
  FROM trial_users tu
  LEFT JOIN subscriptions s ON s.user_id = tu.user_id
  GROUP BY tu.user_id, tu.first_trial_start, tu.last_trial_end, tu.last_trialing_date
),
conversion_analysis AS (
  SELECT 
    user_id,
    latest_active_start,
    active_plan,
    all_statuses,
    CASE 
      WHEN latest_active_start IS NOT NULL AND (
        (last_trial_end IS NOT NULL AND latest_active_start >= last_trial_end)
        OR (last_trial_end IS NULL AND last_trialing_date IS NOT NULL AND latest_active_start >= last_trialing_date)
        OR (last_trial_end IS NULL AND last_trialing_date IS NULL)
      ) THEN true
      ELSE false
    END as converted
  FROM user_subscription_status
)
SELECT 
  COUNT(*) as total_trial_users,
  COUNT(*) FILTER (WHERE converted = true) as converted_users,
  COUNT(*) FILTER (WHERE converted = false) as not_converted_users,
  COUNT(*) FILTER (WHERE converted = true AND active_plan = 'learn') as converted_to_learn,
  COUNT(*) FILTER (WHERE converted = true AND active_plan = 'accelerate') as converted_to_accelerate,
  COUNT(*) FILTER (WHERE 'trialing' = ANY(all_statuses) AND NOT ('active' = ANY(all_statuses))) as currently_trialing_only,
  COUNT(*) FILTER (WHERE 'canceled' = ANY(all_statuses) AND NOT ('active' = ANY(all_statuses))) as canceled_only,
  COUNT(*) FILTER (WHERE 'past_due' = ANY(all_statuses) AND NOT ('active' = ANY(all_statuses))) as past_due_only,
  ROUND(
    COUNT(*) FILTER (WHERE converted = true)::numeric / 
    NULLIF(COUNT(*)::numeric, 0) * 100, 
    2
  ) as conversion_rate_percent
FROM conversion_analysis;
```

## Data Sources

- **Supabase**: `subscriptions` table and `bubble_users` table
- **Stripe**: Verified via webhook sync (subscriptions are synced from Stripe to Supabase)

## Notes

- Bubble transfer users are excluded because they didn't go through the normal trial flow
- Conversion is determined by checking if an active subscription exists after the trial period
- The analysis uses the most recent subscription status for each user

