# Amplitude Debugging Guide

If events aren't showing up in Amplitude, follow these steps:

## 1. Check Environment Variables

Verify your `.env.local` file has:
```bash
AMPLITUDE_API_KEY=your_api_key_here
AMPLITUDE_API_SECRET_KEY=your_secret_key_here  # Optional
```

**Important**: Restart your dev server after adding/changing environment variables!

## 2. Check Browser Console

Open your browser's developer console (F12) and look for:
- `📤 Sending event to Amplitude:` - Shows events being sent from client
- `✅ Event sent successfully:` - Confirms API call succeeded
- `❌ Error tracking event:` - Shows any client-side errors
- `🆔 Generated new device ID:` or `🆔 Using existing device ID:` - Confirms device ID is working

## 3. Check Server Logs

In your terminal where you're running `npm run dev`, look for:
- `✅ Amplitude initialized successfully` - Confirms SDK initialized
- `📊 Received tracking request:` - Shows API route received the request
- `✅ Amplitude event tracked:` - Confirms event was sent to Amplitude
- `❌ Error tracking Amplitude event:` - Shows server-side errors
- `⚠️ Amplitude API key not found` - Means API key is missing

## 4. Test the Setup

Visit this URL in your browser to test the setup:
```
http://localhost:3000/api/analytics/test
```

This will:
- Check if API key is set
- Initialize Amplitude
- Send a test event
- Return status information

## 5. Verify API Route is Working

Open browser console and run:
```javascript
fetch('/api/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventType: 'Manual Test Event',
    eventProperties: { 'Test': true },
    deviceId: 'manual-test-' + Date.now()
  })
}).then(r => r.json()).then(console.log)
```

You should see `{ success: true }` in the console.

## 6. Common Issues

### Issue: "Amplitude API key not found"
**Solution**: Add `AMPLITUDE_API_KEY` to your `.env.local` file and restart the server.

### Issue: "Request missing required field"
**Solution**: This means either `user_id` or `device_id` is missing. Check that:
- Device ID is being generated (check console for `🆔` messages)
- User ID is being passed for authenticated users

### Issue: Events not appearing in Amplitude dashboard
**Possible causes**:
1. Events are being batched (wait up to 30 seconds for flush)
2. API key is incorrect
3. Events are being filtered out (check Amplitude dashboard filters)
4. Wrong Amplitude project

### Issue: No console logs appearing
**Solution**: 
- Make sure you're in development mode (`NODE_ENV=development`)
- Check browser console is open
- Check server terminal output

## 7. Force Flush Events

To immediately send queued events, you can call:
```javascript
fetch('/api/analytics/flush', { method: 'POST' })
```

(Note: You may need to create this endpoint if it doesn't exist)

## 8. Check Amplitude Dashboard

1. Go to your Amplitude dashboard
2. Navigate to **User Lookup**
3. Search for your device ID (check browser console for the ID)
4. Or search for your email if you're logged in
5. Check if events appear there

## 9. Verify Event Names

Make sure event names follow the convention:
- ✅ `Page Viewed` (Title Case)
- ✅ `Sign Up Clicked` (Title Case)
- ❌ `page viewed` (wrong case)
- ❌ `pageViewed` (wrong case)

## Still Not Working?

1. Check the server logs for detailed error messages
2. Verify your Amplitude API key is correct
3. Try the test endpoint: `/api/analytics/test`
4. Check Amplitude dashboard for any API errors
5. Verify your Amplitude project is active and receiving data

