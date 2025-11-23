# Session Replay Testing & Verification Guide

This guide helps you verify that Session Replay is working correctly in your application.

## Quick Verification Steps

### 1. Check Browser Console

Open your browser's developer console (F12) and look for these messages when the page loads:

**✅ Success Messages:**
```
✅ Amplitude Browser SDK with Session Replay initialized successfully
📊 Sample rate: 100%  (or 1% in production)
```

**❌ Error Messages to Watch For:**
```
⚠️ Amplitude API key not found. Session Replay will be disabled.
❌ Error initializing Amplitude Browser SDK: [error details]
```

### 2. Check Network Tab

1. Open browser DevTools → **Network** tab
2. Filter by "amplitude" or "session-replay"
3. Look for requests to:
   - `api2.amplitude.com` (or `api2.eu.amplitude.com` for EU)
   - Session replay data uploads

**What to look for:**
- Requests should return `200 OK` status
- You should see periodic uploads of replay data

### 3. Verify in Amplitude Dashboard

#### Option A: User Sessions View

1. Go to your Amplitude dashboard
2. Navigate to **User Lookup** or **User Sessions**
3. Find a recent session (from the last few minutes)
4. Look for a **play icon** or **"View Replay"** button next to sessions
5. Click to watch the replay

#### Option B: User Lookup

1. Go to **User Lookup** in Amplitude
2. Search for your user ID (email) or device ID
3. Find a recent session
4. Look for the replay icon/button

**Note:** Replays may take 1-5 minutes to appear after a session ends.

### 4. Check Session Replay Settings

1. Go to **Settings** → **Account Settings** → **Session Replay**
2. Verify:
   - Session Replay is enabled
   - Your project is listed
   - Sample rate matches your configuration
   - Quota usage is being tracked

### 5. Test Event Tracking

Open browser console and run:

```javascript
// Check if Browser SDK is initialized
console.log('Amplitude available:', typeof window !== 'undefined' && window.amplitude !== undefined);

// Track a test event
import { trackEventBrowser } from '@/lib/amplitude/browser';
trackEventBrowser('Test Session Replay Event', {
  'Test Property': 'Testing Session Replay',
  'Timestamp': new Date().toISOString()
});
```

You should see:
```
📤 Browser SDK event tracked: { eventType: 'Test Session Replay Event', hasProperties: true }
```

### 6. Verify Device ID Consistency

Check that the same device ID is used for both Browser SDK and server-side tracking:

```javascript
// In browser console
import { getDeviceId } from '@/lib/utils/device-id';
console.log('Device ID:', getDeviceId());
```

Then check your Amplitude events - they should use the same device ID.

## Detailed Testing Checklist

### ✅ Initialization Test

- [ ] Browser console shows initialization success message
- [ ] No errors in console related to Amplitude
- [ ] `NEXT_PUBLIC_AMPLITUDE_API_KEY` is set in environment
- [ ] Sample rate is correct (100% in dev, 1% in production)

### ✅ Event Tracking Test

- [ ] Events tracked via Browser SDK appear in Amplitude
- [ ] Events have `[Amplitude] Session Replay ID` property
- [ ] Events are associated with sessions
- [ ] Both Browser SDK and API route events are captured

### ✅ Session Replay Test

- [ ] Replays appear in Amplitude dashboard (within 5 minutes)
- [ ] Replays show correct page interactions
- [ ] Replays include mouse movements and clicks
- [ ] Replays show form inputs (if not masked)
- [ ] Replays show page navigation

### ✅ User Identification Test

- [ ] Authenticated users are identified correctly
- [ ] User ID matches email address
- [ ] Anonymous users have device ID
- [ ] User properties are set correctly

## Troubleshooting Common Issues

### Issue: "Amplitude API key not found"

**Solution:**
1. Check `.env.local` file has `NEXT_PUBLIC_AMPLITUDE_API_KEY` set
2. Restart your dev server (Next.js requires restart for env var changes)
3. Verify the key is the same as `AMPLITUDE_API_KEY`

### Issue: No replays appearing in dashboard

**Possible causes:**
1. **Sample rate too low**: Check if your session was sampled (1% in production)
2. **Session too short**: Very short sessions (< 5 seconds) may not capture
3. **Processing delay**: Wait 5-10 minutes for replays to process
4. **Wrong project**: Verify you're looking at the correct Amplitude project
5. **Quota exceeded**: Check Session Replay settings for quota usage

**Solution:**
- Temporarily set sample rate to 1.0 (100%) in development
- Create a longer session (navigate multiple pages, interact with elements)
- Check Session Replay settings in Amplitude dashboard

### Issue: Events not associated with replays

**Solution:**
1. Verify same device ID is used for both Browser SDK and server-side events
2. Ensure events are tracked via Browser SDK (not just API routes)
3. Check that Session Replay ID property is present on events

### Issue: Replays show broken CSS/styling

**Solution:**
1. Check CORS settings - allow `app.amplitude.com` or `app.eu.amplitude.com`
2. Add `crossorigin="anonymous"` to stylesheet links
3. Ensure stylesheets are publicly accessible (not behind auth)

### Issue: Performance issues

**Solution:**
1. Reduce sample rate if too high
2. Check IndexedDB storage (DevTools → Application → IndexedDB)
3. Monitor network tab for excessive requests
4. Consider enabling web worker compression (experimental)

## Testing Script

Run this in your browser console to perform a comprehensive test:

```javascript
// Test Session Replay Setup
(async function testSessionReplay() {
  console.log('🧪 Testing Session Replay Setup...\n');
  
  // 1. Check API Key
  const hasApiKey = !!process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  console.log('1. API Key:', hasApiKey ? '✅ Set' : '❌ Missing');
  
  // 2. Check Amplitude SDK
  const hasAmplitude = typeof window !== 'undefined' && window.amplitude !== undefined;
  console.log('2. Amplitude SDK:', hasAmplitude ? '✅ Initialized' : '❌ Not initialized');
  
  // 3. Check Device ID
  try {
    const { getDeviceId } = await import('/lib/utils/device-id');
    const deviceId = getDeviceId();
    console.log('3. Device ID:', deviceId ? `✅ ${deviceId}` : '❌ Missing');
  } catch (e) {
    console.log('3. Device ID:', '❌ Error:', e.message);
  }
  
  // 4. Test Event Tracking
  try {
    const { trackEventBrowser } = await import('/lib/amplitude/browser');
    trackEventBrowser('Session Replay Test Event', {
      'Test': true,
      'Timestamp': new Date().toISOString()
    });
    console.log('4. Event Tracking:', '✅ Test event sent');
  } catch (e) {
    console.log('4. Event Tracking:', '❌ Error:', e.message);
  }
  
  // 5. Check IndexedDB (Session Replay storage)
  try {
    const db = indexedDB.open('amplitude-session-replay');
    db.onsuccess = () => {
      console.log('5. IndexedDB:', '✅ Available');
    };
    db.onerror = () => {
      console.log('5. IndexedDB:', '❌ Not available');
    };
  } catch (e) {
    console.log('5. IndexedDB:', '❌ Error:', e.message);
  }
  
  console.log('\n✅ Test complete! Check Amplitude dashboard for replays in 1-5 minutes.');
})();
```

## Expected Behavior

### In Development (100% sample rate):
- ✅ All sessions should be captured
- ✅ Replays appear within 1-5 minutes
- ✅ Console shows detailed debug logs

### In Production (1% sample rate):
- ⚠️ Only ~1% of sessions are captured
- ⚠️ May need to test multiple times to get a sampled session
- ✅ Replays appear within 1-5 minutes for sampled sessions

## Next Steps

Once verified:
1. ✅ Adjust sample rate for production based on your quota
2. ✅ Configure privacy masking for sensitive data
3. ✅ Set up alerts for quota usage
4. ✅ Train team on viewing and analyzing replays

## Additional Resources

- [Amplitude Session Replay Documentation](https://docs.amplitude.com/data/session-replay/)
- [Session Replay Ingestion Monitor](https://docs.amplitude.com/data/session-replay/ingestion-monitor)
- [Troubleshooting Session Replay](https://docs.amplitude.com/data/session-replay/session-replay-troubleshooting)

