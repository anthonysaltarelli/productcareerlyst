# Webhook Testing Guide

## Step-by-Step Testing Instructions

### Prerequisites Checklist

- [ ] Local Next.js server running on port 3000
- [ ] ngrok installed and configured
- [ ] Resend API key in `.env.local`
- [ ] Resend webhook secret (will get this in Step 2)

---

## Step 1: Start Your Local Server

**You need to do this:**

```bash
npm run dev
```

This should start your Next.js server on `http://localhost:3000`.

**Verify:** Open `http://localhost:3000` in your browser to confirm it's running.

---

## Step 2: Set Up ngrok Tunnel

**You need to do this:**

1. **Install ngrok** (if not already installed):
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start ngrok tunnel**:
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** that ngrok provides:
   - It will look like: `https://abc123.ngrok.io`
   - **Important:** Copy the full URL including `https://`

4. **Keep ngrok running** - Don't close this terminal window!

**Example output:**
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

Your webhook endpoint will be: `https://abc123.ngrok.io/api/email/webhook`

---

## Step 3: Create Webhook in Resend Dashboard

**You need to do this:**

1. **Go to Resend Dashboard**: https://resend.com/webhooks

2. **Click "Add Webhook"**

3. **Fill in the form**:
   - **Endpoint URL**: `https://YOUR_NGROK_URL.ngrok.io/api/email/webhook`
     - Replace `YOUR_NGROK_URL` with your actual ngrok URL
   - **Events**: Select all events:
     - ✅ email.sent
     - ✅ email.delivered
     - ✅ email.opened
     - ✅ email.clicked
     - ✅ email.bounced
     - ✅ email.complained

4. **Click "Add"**

5. **Copy the Webhook Signing Secret**:
   - After creating the webhook, you'll see a "Signing Secret"
   - Copy this secret
   - Add it to your `.env.local` file:
     ```
     RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
     ```

6. **Restart your Next.js server** to load the new environment variable:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

---

## Step 4: Test the Webhook

**I can help with this!** Run the test script:

```bash
npx tsx scripts/test-webhook-handler.ts
```

This script will:
1. Send a test email to `anthsalt@gmail.com`
2. Wait for webhook events
3. Check if events were logged in the database
4. Verify scheduled email status updates

**What to look for:**

✅ **Success indicators:**
- Email sent successfully
- Webhook events found in `email_events` table
- Server logs show webhook requests received
- Email arrives in inbox

❌ **If webhook events are not found:**
- Check ngrok is still running
- Check webhook URL in Resend dashboard matches ngrok URL
- Check server logs for webhook requests
- Verify `RESEND_WEBHOOK_SECRET` is set correctly
- Check Resend dashboard for webhook delivery status

---

## Step 5: Verify Webhook Events in Resend Dashboard

**You need to do this:**

1. **Go to Resend Dashboard**: https://resend.com/webhooks
2. **Click on your webhook**
3. **Check the "Events" tab**
4. **Look for recent events** - you should see:
   - `email.sent` event
   - `email.delivered` event (if email was delivered)

**If events show as "Failed":**
- Check your server logs for errors
- Verify webhook signature verification is working
- Check that your server is accessible via ngrok

---

## Step 6: Check Database

**I can help with this!** The test script will check the database automatically.

**Or manually check:**

```sql
-- Check webhook events
SELECT * FROM email_events 
WHERE resend_email_id = 'YOUR_RESEND_EMAIL_ID'
ORDER BY occurred_at;

-- Check scheduled emails (if applicable)
SELECT * FROM scheduled_emails 
WHERE resend_email_id = 'YOUR_RESEND_EMAIL_ID';
```

---

## Troubleshooting

### Webhook events not received

1. **Check ngrok is running**: `ngrok http 3000`
2. **Verify webhook URL**: Must match your current ngrok URL
3. **Check server logs**: Look for POST requests to `/api/email/webhook`
4. **Test webhook endpoint manually**:
   ```bash
   curl -X POST https://YOUR_NGROK_URL.ngrok.io/api/email/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

### Signature verification failing

1. **Check RESEND_WEBHOOK_SECRET**: Must match the secret from Resend dashboard
2. **Verify raw body**: Webhook handler must use raw request body (not parsed JSON)
3. **Check Svix headers**: Must include `svix-id`, `svix-timestamp`, `svix-signature`

### Events not in database

1. **Check webhook handler logs**: Look for errors in server console
2. **Verify database connection**: Check Supabase credentials
3. **Check event type mapping**: Resend uses `email.sent`, database uses `sent`

---

## Next Steps

Once webhook testing is working:

1. ✅ Test with different event types (bounced, complained)
2. ✅ Test with scheduled emails (not just immediate sends)
3. ✅ Test idempotency (send same webhook twice)
4. ✅ Test with emails not in database (should still log events)

---

## Quick Reference

**Webhook Endpoint:** `/api/email/webhook`  
**Test Email:** `anthsalt@gmail.com`  
**Environment Variable:** `RESEND_WEBHOOK_SECRET`  
**Test Script:** `npx tsx scripts/test-webhook-handler.ts`

