# Production Webhook Setup Guide

## Overview

This guide walks you through setting up Resend webhooks for your production environment. Unlike development (which uses ngrok), production uses your actual deployed application URL.

---

## Prerequisites

- [ ] Your Next.js app is deployed to production (e.g., Vercel, Railway, etc.)
- [ ] Your production URL is accessible via HTTPS
- [ ] You have access to your production environment variables
- [ ] You have access to the Resend dashboard

---

## Step 1: Get Your Production URL

**Your production webhook endpoint will be:**
```
https://YOUR_PRODUCTION_DOMAIN/api/email/webhook
```

**Examples:**
- Vercel: `https://productcareerlyst.vercel.app/api/email/webhook`
- Custom domain: `https://productcareerlyst.com/api/email/webhook`

**Verify your endpoint is accessible:**
```bash
curl https://YOUR_PRODUCTION_DOMAIN/api/email/webhook
```

You should get a response (even if it's an error about missing POST data - that's fine, it means the endpoint exists).

---

## Step 2: Create Production Webhook in Resend

1. **Go to Resend Dashboard**: https://resend.com/webhooks

2. **Click "Add Webhook"** (or edit your existing development webhook)

3. **Fill in the form**:
   - **Endpoint URL**: `https://YOUR_PRODUCTION_DOMAIN/api/email/webhook`
     - Replace `YOUR_PRODUCTION_DOMAIN` with your actual production domain
   - **Events**: Select all events:
     - ✅ email.sent
     - ✅ email.delivered
     - ✅ email.opened
     - ✅ email.clicked
     - ✅ email.bounced
     - ✅ email.complained

4. **Click "Add"** (or "Update" if editing)

5. **Copy the Webhook Signing Secret**:
   - After creating/updating the webhook, you'll see a "Signing Secret"
   - **Important**: This is different from your development webhook secret
   - Copy this secret - you'll need it in the next step

---

## Step 3: Set Production Environment Variable

### If Using Vercel:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add/Update the variable**:
   - **Key**: `RESEND_WEBHOOK_SECRET`
   - **Value**: `whsec_xxxxxxxxxxxxx` (the production webhook secret from Step 2)
   - **Environment**: Select "Production" (and optionally "Preview" if you want)
5. **Click "Save"**
6. **Redeploy your application** to apply the new environment variable:
   - Go to Deployments tab
   - Click "..." on the latest deployment
   - Click "Redeploy"

### If Using Other Platforms:

Add the environment variable to your production environment:
- **Key**: `RESEND_WEBHOOK_SECRET`
- **Value**: `whsec_xxxxxxxxxxxxx` (the production webhook secret from Step 2)

Then restart/redeploy your application.

---

## Step 4: Verify Webhook Configuration

### Option A: Test with a Production Email

1. **Send a test email** from your production app (or via Resend API)
2. **Check Resend Dashboard**:
   - Go to https://resend.com/webhooks
   - Click on your production webhook
   - Check the "Events" tab
   - You should see recent events with "Success" status

3. **Check your production logs**:
   - Look for webhook POST requests to `/api/email/webhook`
   - Verify no signature verification errors

### Option B: Use Resend's Webhook Test Feature

1. **Go to Resend Dashboard**: https://resend.com/webhooks
2. **Click on your production webhook**
3. **Click "Test" or "Send Test Event"**
4. **Verify**:
   - Event shows as "Success" in Resend dashboard
   - Your production logs show the webhook was received
   - Database has the event logged (if you have database access)

---

## Step 5: Monitor Webhook Health

### In Resend Dashboard:

1. **Go to Webhooks**: https://resend.com/webhooks
2. **Click on your production webhook**
3. **Monitor**:
   - **Status**: Should be "Active" or "Enabled"
   - **Recent Events**: Check for any failed deliveries
   - **Response Times**: Should be reasonable (< 1 second)

### In Your Application:

1. **Check application logs** for webhook requests
2. **Monitor database** for webhook events:
   ```sql
   SELECT 
     event_type,
     COUNT(*) as count,
     MAX(created_at) as last_event
   FROM email_events
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY event_type
   ORDER BY last_event DESC;
   ```

---

## Important Notes

### Development vs Production Webhooks

- **Development**: Uses ngrok URL (changes each time you restart ngrok)
- **Production**: Uses your permanent production domain
- **Different Secrets**: Each webhook has its own signing secret
- **Both Can Exist**: You can have both development and production webhooks active simultaneously

### Webhook Retry Schedule

If Resend doesn't receive a 200 response, it will retry:
- 5 seconds
- 5 minutes
- 30 minutes
- 2 hours
- 5 hours
- 10 hours

Make sure your production endpoint is always available and returns 200 OK.

### IP Allowlisting (If Needed)

If your server requires IP allowlisting, Resend webhooks come from:
- `44.228.126.217`
- `50.112.21.217`
- `52.24.126.164`
- `54.148.139.208`
- `2600:1f24:64:8000::/52`

---

## Troubleshooting

### Webhook Events Not Received

1. **Check endpoint is accessible**:
   ```bash
   curl https://YOUR_PRODUCTION_DOMAIN/api/email/webhook
   ```

2. **Check Resend dashboard**:
   - Is webhook status "Active"?
   - Are there any failed events?
   - What's the error message?

3. **Check production logs**:
   - Are webhook requests reaching your server?
   - Any signature verification errors?
   - Any database errors?

4. **Verify environment variable**:
   - Is `RESEND_WEBHOOK_SECRET` set in production?
   - Does it match the secret from Resend dashboard?
   - Did you redeploy after setting it?

### Signature Verification Failing

1. **Verify secret matches**: Production secret must match Resend dashboard
2. **Check raw body handling**: Webhook handler must use raw request body
3. **Check Svix headers**: Must include `svix-id`, `svix-timestamp`, `svix-signature`

### Events Not in Database

1. **Check webhook handler logs**: Look for processing errors
2. **Verify database connection**: Is Supabase accessible from production?
3. **Check event type mapping**: Resend uses `email.sent`, database uses `sent`

---

## Quick Reference

**Production Webhook Endpoint**: `https://YOUR_PRODUCTION_DOMAIN/api/email/webhook`  
**Environment Variable**: `RESEND_WEBHOOK_SECRET`  
**Resend Dashboard**: https://resend.com/webhooks  
**Webhook Events**: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained

---

## Next Steps

After setting up production webhooks:

1. ✅ Test with a real email send
2. ✅ Monitor webhook health for 24-48 hours
3. ✅ Set up alerts for webhook failures (if available)
4. ✅ Document your production webhook URL for your team
5. ✅ Consider setting up a staging webhook (if you have a staging environment)

