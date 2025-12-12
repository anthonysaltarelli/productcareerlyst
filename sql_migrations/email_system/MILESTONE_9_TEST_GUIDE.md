# Milestone 9: Email Preferences & Unsubscribe System - Testing Guide

## Overview

This guide covers testing the email preferences and unsubscribe system, including:
- Unsubscribe page (public, unauthenticated)
- Settings page integration (authenticated)
- Marketing email unsubscribe links
- Preference checking before sending
- Automatic cancellation of scheduled emails

## Prerequisites

1. **Database Migration**: Ensure `001_create_tables.sql` has been run
2. **Environment Variables**:
   - `NEXT_PUBLIC_APP_URL` (or defaults to `https://productcareerlyst.com`)
   - `RESEND_API_KEY`
   - `CONVERTKIT_API_KEY` (optional, for newsletter sync)
   - `CONVERTKIT_NEWSLETTER_FORM_ID` (optional, defaults to 7348426)

## Testing Checklist

### 1. Verify Marketing Email Templates Have Unsubscribe Links

#### Test: Check Template Metadata

1. **Check Database**:
   ```sql
   SELECT id, name, metadata->>'email_type', metadata->>'unsubscribe_url_placeholder'
   FROM email_templates
   WHERE metadata->>'email_type' = 'marketing';
   ```

2. **Expected Result**: All marketing templates should have:
   - `email_type: 'marketing'` in metadata
   - `unsubscribe_url_placeholder: '{{unsubscribe_url}}'` (optional, for HTML templates)

#### Test: Verify Unsubscribe Link in Rendered Emails

1. **Send Test Email via Admin Dashboard**:
   - Go to `/admin/emails`
   - Select a marketing template (e.g., "Trial Welcome Email")
   - Send test email to your test address
   - Check the email HTML source

2. **Expected Result**: Email should contain unsubscribe link like:
   ```html
   <a href="https://productcareerlyst.com/unsubscribe/[token]">
     Unsubscribe from marketing emails
   </a>
   ```

3. **Verify Token Generation**:
   ```sql
   SELECT * FROM email_unsubscribe_tokens
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   - Should see a token record with `used_at = NULL`
   - Token should expire in 30 days

### 2. Test Unsubscribe Page (Public, Unauthenticated)

#### Test: Access Unsubscribe Page

1. **Get Unsubscribe Token**:
   - Schedule a marketing email for a test user
   - Check database for token:
     ```sql
     SELECT token, email_address, expires_at, used_at
     FROM email_unsubscribe_tokens
     WHERE email_address = 'your-test-email@example.com'
     ORDER BY created_at DESC
     LIMIT 1;
     ```

2. **Visit Unsubscribe Page**:
   - Navigate to: `http://localhost:3000/unsubscribe/[token]`
   - Replace `[token]` with the token from database

3. **Expected Result**:
   - Page loads without requiring authentication
   - Shows user's email address
   - Shows current email preferences
   - Shows topic checkboxes

#### Test: Unsubscribe Flow

1. **Unsubscribe via Page**:
   - Uncheck some email topics
   - Optionally enter unsubscribe reason
   - Click "Unsubscribe from Marketing Emails"

2. **Verify Database Updates**:
   ```sql
   SELECT marketing_emails_enabled, unsubscribed_at, unsubscribe_reason, email_topics
   FROM user_email_preferences
   WHERE email_address = 'your-test-email@example.com';
   ```
   - `marketing_emails_enabled` should be `false`
   - `unsubscribed_at` should be set
   - `email_topics` should reflect unchecked topics

3. **Verify Token Marked as Used**:
   ```sql
   SELECT used_at FROM email_unsubscribe_tokens WHERE token = '[token]';
   ```
   - `used_at` should be set (token cannot be reused)

4. **Verify Scheduled Emails Cancelled**:
   ```sql
   SELECT id, status, suppression_reason, cancelled_at
   FROM scheduled_emails
   WHERE user_id = '[user_id]'
     AND email_address = 'your-test-email@example.com'
     AND metadata->>'email_type' = 'marketing'
     AND status IN ('pending', 'scheduled');
   ```
   - All marketing emails should have `status = 'cancelled'`
   - `suppression_reason` should be `'unsubscribed'`
   - `cancelled_at` should be set

#### Test: Resubscribe Flow

1. **Resubscribe via Page**:
   - After unsubscribing, click "Resubscribe to Marketing Emails"

2. **Verify Database Updates**:
   ```sql
   SELECT marketing_emails_enabled, unsubscribed_at
   FROM user_email_preferences
   WHERE email_address = 'your-test-email@example.com';
   ```
   - `marketing_emails_enabled` should be `true`
   - `unsubscribed_at` should be `NULL`

### 3. Test Settings Page Integration (Authenticated)

#### Test: Access Notifications Tab

1. **Navigate to Settings**:
   - Go to `/dashboard/settings` (must be logged in)
   - Click "Notifications" tab

2. **Expected Result**:
   - Shows "Email Notifications" section
   - Shows global marketing toggle
   - Shows topic-level preferences
   - Shows current preferences from database

#### Test: Update Preferences

1. **Toggle Marketing Emails**:
   - Turn off "Marketing Emails" toggle
   - Click "Save Preferences"

2. **Verify Database Updates**:
   ```sql
   SELECT marketing_emails_enabled, unsubscribed_at
   FROM user_email_preferences
   WHERE user_id = '[your_user_id]';
   ```
   - `marketing_emails_enabled` should be `false`
   - `unsubscribed_at` should be set

3. **Verify Scheduled Emails Cancelled**:
   - Check `scheduled_emails` table for cancelled marketing emails

4. **Toggle Topics**:
   - Check/uncheck specific topics
   - Click "Save Preferences"
   - Verify `email_topics` array updates in database

### 4. Test Preference Checking Before Sending

#### Test: Marketing Email Blocked for Unsubscribed User

1. **Setup**:
   - Unsubscribe a test user
   - Try to schedule a marketing email for that user

2. **Expected Result**:
   - Email should NOT be scheduled
   - `scheduled_emails` record should have `status = 'suppressed'`
   - `metadata->>'suppression_reason'` should be `'user_preferences'`

3. **Verify in Database**:
   ```sql
   SELECT status, metadata->>'suppression_reason'
   FROM scheduled_emails
   WHERE user_id = '[unsubscribed_user_id]'
     AND metadata->>'email_type' = 'marketing'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

#### Test: Transactional Email Still Sent for Unsubscribed User

1. **Setup**:
   - Unsubscribe a test user
   - Schedule a transactional email (e.g., OTP email)

2. **Expected Result**:
   - Email should be scheduled normally
   - `status` should be `'scheduled'` or `'pending'`
   - Transactional emails are NOT blocked by unsubscribe

### 5. Test Email Sequence Cancellation

#### Test: Cancel All Marketing Emails on Unsubscribe

1. **Setup**:
   - Schedule a trial sequence (8 marketing emails) for a test user
   - Verify all 8 emails are scheduled:
     ```sql
     SELECT COUNT(*) FROM scheduled_emails
     WHERE user_id = '[user_id]'
       AND metadata->>'email_type' = 'marketing'
       AND status IN ('pending', 'scheduled');
     ```

2. **Unsubscribe User**:
   - Use unsubscribe page or settings page
   - Unsubscribe the user

3. **Verify All Emails Cancelled**:
   ```sql
   SELECT COUNT(*) FROM scheduled_emails
   WHERE user_id = '[user_id]'
     AND metadata->>'email_type' = 'marketing'
     AND status = 'cancelled'
     AND suppression_reason = 'unsubscribed';
   ```
   - Should be 8 (all marketing emails cancelled)

4. **Verify Transactional Emails NOT Cancelled**:
   ```sql
   SELECT COUNT(*) FROM scheduled_emails
   WHERE user_id = '[user_id]'
     AND metadata->>'email_type' = 'transactional'
     AND status IN ('pending', 'scheduled');
   ```
   - Transactional emails should still be scheduled

### 6. Test Unsubscribe Link Generation

#### Test: Unsubscribe URL in Scheduled Emails

1. **Schedule Marketing Email**:
   - Use admin dashboard to schedule a marketing email
   - Check the email record in database

2. **Verify Unsubscribe URL Generated**:
   - The email should have an unsubscribe URL in the rendered HTML
   - URL format: `https://productcareerlyst.com/unsubscribe/[token]`
   - Token should exist in `email_unsubscribe_tokens` table

3. **Test URL**:
   - Copy the unsubscribe URL from email
   - Visit the URL in browser
   - Should load unsubscribe page without authentication

### 7. Test Local Development

#### Setup

1. **Start Local Server**:
   ```bash
   npm run dev
   ```

2. **Set Environment Variable**:
   ```bash
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Test Unsubscribe Page**:
   - Generate token via scheduling an email
   - Visit `http://localhost:3000/unsubscribe/[token]`
   - Should work identically to production

#### Test: Local Unsubscribe Flow

1. **Schedule Test Email**:
   - Use admin dashboard to schedule marketing email
   - Check email HTML for unsubscribe link
   - Link should point to `http://localhost:3000/unsubscribe/[token]`

2. **Click Unsubscribe Link**:
   - Open email in browser (or copy link)
   - Click unsubscribe link
   - Should redirect to local unsubscribe page

3. **Complete Unsubscribe**:
   - Follow unsubscribe flow
   - Verify database updates
   - Verify scheduled emails cancelled

### 8. Test Production

#### Setup

1. **Deploy to Production**:
   - Ensure `NEXT_PUBLIC_APP_URL` is set to production URL
   - Deploy code

2. **Test with Real Email**:
   - Schedule marketing email to real email address
   - Check email for unsubscribe link
   - Link should point to production URL

#### Test: Production Unsubscribe Flow

1. **Receive Email**:
   - Check inbox for marketing email
   - Verify unsubscribe link is present

2. **Click Unsubscribe**:
   - Click unsubscribe link in email
   - Should redirect to production unsubscribe page
   - Complete unsubscribe flow

3. **Verify**:
   - Check database for updates
   - Verify scheduled emails cancelled
   - Verify no more marketing emails sent

### 9. Test Edge Cases

#### Test: Expired Token

1. **Manually Expire Token**:
   ```sql
   UPDATE email_unsubscribe_tokens
   SET expires_at = NOW() - INTERVAL '1 day'
   WHERE token = '[token]';
   ```

2. **Try to Use Token**:
   - Visit unsubscribe page with expired token
   - Should show "Invalid or expired token" error

#### Test: Already Used Token

1. **Use Token Once**:
   - Complete unsubscribe flow
   - Token should be marked as used

2. **Try to Use Again**:
   - Visit unsubscribe page with same token
   - Should show "Token has already been used" error

#### Test: Invalid Token

1. **Use Random Token**:
   - Visit `http://localhost:3000/unsubscribe/invalid-token-12345`
   - Should show "Invalid or expired token" error

#### Test: User Without Preferences

1. **New User**:
   - Create a new user (or use one without preferences)
   - Try to schedule marketing email

2. **Expected Result**:
   - Preferences should be created automatically
   - Email should be scheduled (default: marketing enabled)

## Verification Checklist

- [ ] Marketing email templates have unsubscribe links
- [ ] Unsubscribe page loads without authentication
- [ ] Unsubscribe flow updates database correctly
- [ ] Scheduled marketing emails are cancelled on unsubscribe
- [ ] Transactional emails are NOT cancelled on unsubscribe
- [ ] Settings page shows email preferences
- [ ] Settings page updates preferences correctly
- [ ] Marketing emails are blocked for unsubscribed users
- [ ] Transactional emails still sent for unsubscribed users
- [ ] Unsubscribe tokens expire after 30 days
- [ ] Used tokens cannot be reused
- [ ] Local development works with localhost URLs
- [ ] Production works with production URLs

## Common Issues & Solutions

### Issue: Unsubscribe link not appearing in emails

**Solution**:
1. Check template metadata has `email_type: 'marketing'`
2. Verify `generateUnsubscribeToken` is called in `scheduleEmail`
3. Check `NEXT_PUBLIC_APP_URL` is set correctly
4. Verify template component accepts `unsubscribeUrl` prop

### Issue: Preferences not updating

**Solution**:
1. Check API route is returning correct data
2. Verify database constraints (unique on user_id + email_address)
3. Check browser console for errors
4. Verify user is authenticated (for settings page)

### Issue: Scheduled emails not cancelling

**Solution**:
1. Check `cancelScheduledMarketingEmails` is called
2. Verify email_type is 'marketing' in metadata
3. Check Resend API calls are working
4. Verify database updates are happening

### Issue: Token validation failing

**Solution**:
1. Check token exists in database
2. Verify token hasn't expired
3. Check token hasn't been used
4. Verify timezone issues (expires_at comparison)

## Next Steps

After completing Milestone 9, proceed to:
- **Milestone 10**: ConvertKit Integration (newsletter sync)



