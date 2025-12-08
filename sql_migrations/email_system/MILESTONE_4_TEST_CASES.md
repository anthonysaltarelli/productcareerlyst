# Milestone 4: Email Service - Test Cases

## Overview

This document provides clear test cases for Milestone 4: Email Service (Basic Scheduling). Each test case includes:
- **Test Name**: What you're testing
- **Steps**: How to perform the test
- **Expected Outcome**: What should happen
- **Verification**: How to confirm it worked

---

## Test Case 1: Schedule Single Email

### Test Name
Schedule a single email successfully

### Steps
1. Navigate to `/admin/emails`
2. Click on the **"Schedule Test Email"** tab
3. Select a template from the dropdown (e.g., "trial_welcome v1")
4. Enter test email: `anthsalt+test1@gmail.com`
5. Set schedule time to **2 minutes** from now
6. Click **"Schedule Email"** button

### Expected Outcome
- Success message appears: "Email scheduled successfully! ID: [id]... Scheduled for [datetime]"
- Form resets (template selection cleared, email resets to default)
- Email appears in "Scheduled Emails" tab

### Verification
1. Go to **"Scheduled Emails"** tab
2. Find the email you just scheduled
3. Verify:
   - Email address matches: `anthsalt+test1@gmail.com`
   - Template name and version are correct
   - Status is **"scheduled"** (blue badge)
   - Type is **"Test"** (yellow badge)
   - Scheduled At time is approximately 2 minutes from now
   - Resend Email ID is present (if Resend API call succeeded)

### Database Check (Optional)
```sql
SELECT 
  id,
  email_address,
  template_id,
  status,
  scheduled_at,
  is_test,
  resend_email_id,
  idempotency_key
FROM scheduled_emails
WHERE email_address = 'anthsalt+test1@gmail.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**: One record with `status = 'scheduled'` and `is_test = true`

---

## Test Case 2: Idempotency Check (Prevent Duplicate Sends)

### Test Name
Verify idempotency prevents duplicate emails

### Steps
1. Navigate to `/admin/emails` → **"Schedule Test Email"** tab
2. Select template: "trial_welcome v1"
3. Enter email: `anthsalt+idempotency-test@gmail.com`
4. Set schedule time to **3 minutes**
5. Click **"Schedule Email"** button
6. **Immediately** click **"Schedule Email"** button again (same template, same email, same time)

### Expected Outcome
- First click: Success message with email ID
- Second click: **No error** - should return the same email ID (idempotent behavior)
- Only **ONE** email record created in database

### Verification
1. Go to **"Scheduled Emails"** tab
2. Filter by email: `anthsalt+idempotency-test@gmail.com`
3. Verify only **ONE** email appears (not two)
4. Check the email details - should have the same ID from both attempts

### Database Check
```sql
SELECT COUNT(*) as count
FROM scheduled_emails
WHERE email_address = 'anthsalt+idempotency-test@gmail.com'
  AND scheduled_at::date = CURRENT_DATE;
```

**Expected**: `count = 1` (not 2)

---

## Test Case 3: Cancel Scheduled Email

### Test Name
Cancel a scheduled email before it's sent

### Steps
1. Schedule an email (use Test Case 1 steps)
   - Email: `anthsalt+cancel-test@gmail.com`
   - Schedule: **5 minutes** from now
2. Go to **"Scheduled Emails"** tab
3. Find the email you just scheduled
4. Click **"Cancel"** button
5. Confirm cancellation in the dialog

### Expected Outcome
- Email status changes from **"scheduled"** to **"cancelled"** (gray badge)
- Cancel button disappears (only shows for pending/scheduled emails)
- Email is cancelled in Resend (if Resend API call succeeded)

### Verification
1. In **"Scheduled Emails"** tab:
   - Status badge changes to **"cancelled"** (gray)
   - Cancel button is no longer visible
2. Filter by status: **"Cancelled"** - email should appear
3. Check `cancelled_at` timestamp is set

### Database Check
```sql
SELECT 
  id,
  status,
  cancelled_at,
  resend_email_id
FROM scheduled_emails
WHERE email_address = 'anthsalt+cancel-test@gmail.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**: 
- `status = 'cancelled'`
- `cancelled_at IS NOT NULL`
- `resend_email_id` is present (was sent to Resend)

---

## Test Case 4: Get Scheduled Emails for User

### Test Name
Retrieve all scheduled emails (admin view)

### Steps
1. Schedule **3 different emails**:
   - Email 1: `anthsalt+user-test1@gmail.com` - 2 minutes
   - Email 2: `anthsalt+user-test2@gmail.com` - 5 minutes
   - Email 3: `anthsalt+user-test3@gmail.com` - 10 minutes
2. Go to **"Scheduled Emails"** tab
3. Click **"Refresh"** button

### Expected Outcome
- All 3 emails appear in the table
- Emails are sorted by scheduled_at (newest first)
- Each email shows correct template, status, and scheduled time

### Verification
1. Verify all 3 emails are visible
2. Check email addresses match
3. Verify status is **"scheduled"** for all
4. Verify scheduled times are correct (2, 5, 10 minutes from now)

### Filters Test
1. Filter by status: **"Scheduled"** - all 3 should appear
2. Filter by status: **"Sent"** - none should appear (they haven't been sent yet)
3. Filter by type: **"Test Only"** - all 3 should appear
4. Filter by type: **"Production Only"** - none should appear

---

## Test Case 5: Database Transaction Atomicity

### Test Name
Verify database operations are atomic (all-or-nothing)

### Steps
1. This test verifies that if Resend API fails, the database record is still created with `status = 'pending'`
2. Schedule an email normally (should succeed)
3. Check database for the record

### Expected Outcome
- If Resend API succeeds: Record has `status = 'scheduled'` and `resend_email_id` is set
- If Resend API fails: Record has `status = 'pending'` and `resend_email_id` is NULL
- In both cases, the database record is created (transaction completes)

### Verification
1. Schedule an email
2. Check database:
```sql
SELECT 
  id,
  status,
  resend_email_id,
  scheduled_at,
  created_at
FROM scheduled_emails
WHERE email_address = '[your-test-email]'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- Record exists
- `status` is either `'scheduled'` (if Resend succeeded) or `'pending'` (if Resend failed)
- `scheduled_at` is set correctly
- `created_at` is set

---

## Test Case 6: Template Version Locking

### Test Name
Verify scheduled emails use template version at scheduling time

### Steps
1. Schedule an email using **"trial_welcome v1"** (active version)
2. Note the `template_version` in the scheduled email
3. (Future: Activate v2, but this doesn't affect already-scheduled emails)

### Expected Outcome
- Scheduled email stores `template_version = 1`
- Scheduled email stores complete `template_snapshot` with v1 data
- Even if v2 becomes active later, this email will still use v1

### Verification
1. Schedule email with v1
2. Check database:
```sql
SELECT 
  id,
  template_version,
  template_snapshot->>'version' as snapshot_version,
  template_snapshot->>'name' as template_name
FROM scheduled_emails
WHERE email_address = '[your-test-email]'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- `template_version = 1`
- `snapshot_version = '1'`
- `template_name = 'trial_welcome'`
- `template_snapshot` contains full template data

---

## Test Case 7: Error Handling - Invalid Template

### Test Name
Handle error when template doesn't exist

### Steps
1. Use browser dev tools or API directly
2. Try to schedule email with invalid template ID: `00000000-0000-0000-0000-000000000000`

### Expected Outcome
- Error message: "Template [id] not found"
- No email record created in database
- Error is returned in API response

### Verification
1. Check API response: Should have `error` field with message
2. Check database: No record should be created

---

## Test Case 8: Error Handling - Invalid Email Address

### Test Name
Handle validation errors for invalid email

### Steps
1. Navigate to `/admin/emails` → **"Schedule Test Email"** tab
2. Select a template
3. Enter invalid email: `not-an-email`
4. Click **"Schedule Email"**

### Expected Outcome
- Error message: "Please enter a valid email address"
- Email is not scheduled
- Form remains filled (user can correct and retry)

### Verification
1. Error message appears in red box
2. No email appears in "Scheduled Emails" tab
3. Database has no record for this email

---

## Test Case 9: Cancel Already-Sent Email

### Test Name
Attempt to cancel an email that's already been sent

### Steps
1. Schedule an email for **1 minute** from now
2. Wait for email to be sent (or manually update status in database to 'sent')
3. Try to cancel the email

### Expected Outcome
- Cancel button should **not appear** for emails with status 'sent'
- If cancel is attempted via API, should return error: "Cannot cancel email with status: sent"

### Verification
1. In "Scheduled Emails" tab, emails with status "sent" should not have Cancel button
2. Status badge shows "sent" (green)

---

## Test Case 10: Multiple Emails - Different Templates

### Test Name
Schedule multiple emails with different templates

### Steps
1. Schedule email 1: Use "trial_welcome" template → `anthsalt+multi1@gmail.com`
2. Schedule email 2: Use "otp_email" template → `anthsalt+multi2@gmail.com`
3. Both scheduled for **3 minutes** from now

### Expected Outcome
- Both emails appear in "Scheduled Emails" tab
- Each shows correct template name and version
- Both have status "scheduled"
- Both are test emails

### Verification
1. Both emails visible in table
2. Template names are different
3. Both have correct scheduled times
4. Both can be cancelled independently

---

## Test Results Checklist

After running all test cases, verify:

- [ ] Test Case 1: Single email scheduling works
- [ ] Test Case 2: Idempotency prevents duplicates
- [ ] Test Case 3: Email cancellation works
- [ ] Test Case 4: Scheduled emails list works with filters
- [ ] Test Case 5: Database transactions are atomic
- [ ] Test Case 6: Template version locking works
- [ ] Test Case 7: Invalid template error handling works
- [ ] Test Case 8: Invalid email validation works
- [ ] Test Case 9: Cannot cancel sent emails
- [ ] Test Case 10: Multiple emails with different templates work

---

## Common Issues & Troubleshooting

### Issue: Email status stays "pending"
**Cause**: Resend API call failed
**Solution**: Check Resend API key and network connection. Email will remain in "pending" status and can be retried later.

### Issue: Idempotency not working
**Cause**: Unique constraint on `idempotency_key` not working
**Solution**: Check database has unique constraint on `scheduled_emails.idempotency_key`

### Issue: Cancel button doesn't appear
**Cause**: Email status is not "pending" or "scheduled"
**Solution**: Only emails with these statuses can be cancelled. Check email status in database.

### Issue: Template not found
**Cause**: Template ID doesn't exist or template is inactive
**Solution**: Verify template exists and is active in "Templates" tab

---

## Next Steps

After completing all test cases:
1. Mark Milestone 4 as complete
2. Proceed to Milestone 5: Flow System
3. Document any issues found during testing

