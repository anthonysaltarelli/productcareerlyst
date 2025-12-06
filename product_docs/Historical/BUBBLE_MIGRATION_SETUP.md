# Bubble User Migration Setup Guide

This guide explains how to automatically transfer existing Bubble users and their subscriptions to the new platform.

## Overview

When a Bubble user signs up with the same email address, the system will:
1. Automatically detect they're a Bubble user
2. Transfer their Stripe subscription
3. Mark them as `transferred_from_bubble = true`
4. Link their Bubble user record

## Setup Steps

### 1. Run Database Migrations

Run these migrations in order:

```sql
-- Create bubble_users table
sql_migrations/bubble_users/001_create_bubble_users.sql

-- Add transfer columns to subscriptions (if you already ran the subscriptions migration)
sql_migrations/subscriptions/002_add_bubble_transfer_columns.sql
```

### 2. Import Bubble Users

Import the exported Bubble users from `public/users.json`:

```bash
# Make sure you have your environment variables set
# NEXT_PUBLIC_SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY

npx tsx scripts/import-bubble-users.ts
```

**What the import does:**
- Reads `public/users.json`
- Only imports users with a Stripe Customer ID (active subscribers)
- Normalizes emails to lowercase
- Skips duplicates
- Stores in `bubble_users` table

### 3. Automatic Transfer on Signup

The system automatically checks and transfers subscriptions when:
- User confirms their email (in `/auth/confirm` route)
- User manually calls `/api/auth/transfer-bubble` endpoint

**How it works:**
1. User signs up with email (e.g., `user@example.com`)
2. User confirms email via link
3. System checks `bubble_users` table for matching email
4. If found with Stripe Customer ID:
   - Fetches subscription from Stripe
   - Creates subscription record in database
   - Marks as `transferred_from_bubble = true`
   - Links Bubble user record

## Database Schema

### `bubble_users` Table

Stores exported Bubble user data:

- `email` - User email (lowercase, unique)
- `stripe_customer_id` - Stripe customer ID from Bubble
- `current_plan` - Plan name from Bubble
- `subscription_status` - Status from Bubble
- `matched_user_id` - Supabase user ID if matched
- `matched_at` - When transfer completed

### `subscriptions` Table (New Columns)

- `transferred_from_bubble` - Boolean flag
- `transferred_at` - Timestamp of transfer

## Manual Transfer

Users can also manually trigger transfer via the API:

```typescript
POST /api/auth/transfer-bubble
```

This endpoint:
- Checks if user email exists in `bubble_users`
- Transfers subscription if found
- Returns transfer status

## Testing

1. **Import test user:**
   ```bash
   npx tsx scripts/import-bubble-users.ts
   ```

2. **Sign up with Bubble user email:**
   - Use an email from `users.json` that has a Stripe Customer ID
   - Complete signup and email confirmation
   - Check dashboard billing page - subscription should appear automatically

3. **Verify transfer:**
   ```sql
   SELECT * FROM subscriptions WHERE transferred_from_bubble = true;
   SELECT * FROM bubble_users WHERE matched_user_id IS NOT NULL;
   ```

## Troubleshooting

### Import script errors
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set
- Check that `public/users.json` exists and is valid JSON
- Verify database migrations have been run

### Transfer not working
- Check that user email matches exactly (case-insensitive)
- Verify Stripe Customer ID exists in Bubble data
- Check Stripe API keys are correct
- Look for errors in server logs

### Subscription not appearing
- Check `bubble_users` table for matched record
- Verify `subscriptions` table has entry with `transferred_from_bubble = true`
- Check Stripe dashboard to confirm subscription exists

## Notes

- Only users with Stripe Customer IDs are imported (active subscribers)
- Email matching is case-insensitive
- Transfer happens automatically on email confirmation
- If transfer fails, user can still use the platform (just won't have subscription)
- Transfer is idempotent - safe to run multiple times

