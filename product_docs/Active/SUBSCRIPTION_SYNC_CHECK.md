# Subscription Sync Check

## Overview

This document describes how to verify that subscription records in Supabase are in sync with Stripe.

## Quick Check Results

A sample check of recent subscriptions shows they are **in sync** with Stripe:

- ✅ Status matches
- ✅ Period dates match
- ✅ Trial dates match

## Running the Full Check

Use the script to check all subscriptions:

```bash
npx tsx scripts/check-subscription-sync.ts
```

This script will:
1. Fetch all subscriptions from Supabase
2. Compare each with Stripe
3. Report any discrepancies in:
   - Status
   - Current period start/end
   - Cancel at period end
   - Canceled at
   - Trial start/end

## What Gets Checked

The script compares these fields:
- `status` - Subscription status (active, trialing, canceled, etc.)
- `current_period_start` - Start of current billing period
- `current_period_end` - End of current billing period
- `cancel_at_period_end` - Whether subscription will cancel at period end
- `canceled_at` - When subscription was canceled (if applicable)
- `trial_start` - Trial period start date
- `trial_end` - Trial period end date

## Common Discrepancies

1. **Status Mismatch**: Supabase shows old status, Stripe has updated status
   - **Fix**: Run sync-subscription API endpoint or wait for webhook

2. **Period Dates Mismatch**: Period rolled over in Stripe but not updated in Supabase
   - **Fix**: Webhook should update this automatically, but can manually sync

3. **Missing in Stripe**: Subscription exists in Supabase but not in Stripe
   - **Fix**: Check if subscription was deleted in Stripe, may need to clean up database

4. **Missing in Supabase**: Subscription exists in Stripe but not in Supabase
   - **Fix**: Run sync-subscription API endpoint with the subscription ID

## Sync Methods

### Automatic (Recommended)
- Webhooks automatically sync subscriptions when they change in Stripe
- Webhook endpoint: `/api/stripe/webhook`

### Manual Sync
- Use the sync-subscription API: `POST /api/stripe/sync-subscription`
- Requires authentication and subscription ID

## Monitoring

Check for stale subscriptions (not updated in 7+ days):

```sql
SELECT 
  stripe_subscription_id,
  status,
  updated_at,
  NOW() - updated_at as time_since_update
FROM subscriptions
WHERE stripe_subscription_id IS NOT NULL
  AND status IN ('active', 'trialing', 'past_due')
  AND updated_at < NOW() - INTERVAL '7 days'
ORDER BY updated_at ASC;
```

## Notes

- The script includes rate limiting (100ms delay between Stripe API calls)
- Large subscription lists may take several minutes to check
- The script will exit with code 1 if discrepancies are found

