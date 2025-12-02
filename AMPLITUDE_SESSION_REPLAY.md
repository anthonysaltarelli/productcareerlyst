# Amplitude Session Replay Setup

This document describes the Session Replay integration for Product Careerlyst.

## Overview

Session Replay captures user interactions with your application and creates video-like replays that you can watch in Amplitude. This helps you understand user behavior, debug issues, and improve the user experience.

## Environment Setup

Add your Amplitude API key to your environment variables with the `NEXT_PUBLIC_` prefix so it's accessible on the client side:

```bash
# Required for Session Replay (Browser SDK)
NEXT_PUBLIC_AMPLITUDE_API_KEY=your_amplitude_api_key_here

# Optional: Set server zone (US or EU)
NEXT_PUBLIC_AMPLITUDE_SERVER_ZONE=US

# Existing server-side key (still used for API routes)
AMPLITUDE_API_KEY=your_amplitude_api_key_here
AMPLITUDE_API_SECRET_KEY=your_amplitude_secret_key_here
```

**Important**: The `NEXT_PUBLIC_AMPLITUDE_API_KEY` must be the same as your `AMPLITUDE_API_KEY` for Session Replay to work correctly with your existing events.

## Architecture

### Browser SDK (`lib/amplitude/browser.ts`)
- Initializes the Amplitude Browser SDK with Session Replay plugin
- Handles client-side event tracking
- Manages Session Replay collection
- Provides functions to enable/disable replay collection

### AmplitudeProvider (`app/components/AmplitudeProvider.tsx`)
- Initializes Browser SDK with Session Replay on app load
- Identifies users in both server-side and Browser SDK
- Ensures proper user tracking across both systems

### Client Utilities (`lib/amplitude/client.ts`)
- Provides unified tracking interface
- Can use Browser SDK when available (for Session Replay)
- Falls back to API routes for server-side tracking

## Configuration

### Sample Rate

The sample rate controls what percentage of sessions are captured for replay. By default:
- **Development**: 100% (1.0) - All sessions captured for testing
- **Production**: 1% (0.01) - Adjust based on your monthly quota

To change the sample rate, edit `lib/amplitude/browser.ts`:

```typescript
const sampleRate = process.env.NODE_ENV === 'development' ? 1.0 : 0.01;
```

**Important**: Consider your monthly Session Replay quota when setting the sample rate. If you have a quota of 2,500,000 sessions and average 3,000,000 monthly sessions, set the sample rate to 0.83 or lower to ensure you don't exceed your quota.

### Session Tracking

Session Replay automatically enables session tracking. This ensures that:
- Session Start and Session End events are captured
- Events are properly associated with sessions
- Replays can be viewed in Amplitude

### Performance Optimizations

The implementation includes several performance optimizations:
- **Idle callback compression**: Events are compressed during browser idle periods
- **IndexedDB storage**: Replay events are persisted in IndexedDB for reliability
- **Stylesheet inlining**: CSS is inlined to prevent broken replays
- **Asynchronous processing**: Replay capture doesn't block the main thread

## Usage

### Automatic Initialization

Session Replay is automatically initialized when the app loads via the `AmplitudeProvider` component. No additional setup is required.

### Disabling Session Replay

To disable Session Replay in privacy-sensitive areas:

```typescript
import { disableSessionReplay } from '@/lib/amplitude/browser';

// Disable replay collection
await disableSessionReplay();
```

To re-enable:

```typescript
import { enableSessionReplay } from '@/lib/amplitude/browser';

// Re-enable replay collection
await enableSessionReplay();
```

### Tracking Events

Events tracked via the Browser SDK are automatically associated with Session Replay. Use the standard tracking methods:

```typescript
import { trackEventBrowser } from '@/lib/amplitude/browser';

trackEventBrowser('User Clicked Button', {
  'Button Name': 'Sign Up',
  'Page Name': 'Home',
});
```

Or use the unified client interface:

```typescript
import { trackEvent } from '@/lib/amplitude/client';

trackEvent('User Clicked Button', {
  'Button Name': 'Sign Up',
  'Page Name': 'Home',
});
```

## Viewing Replays

1. Go to your Amplitude dashboard
2. Navigate to **User Lookup** or **User Sessions**
3. Find a session that has Session Replay enabled
4. Click on the replay icon to watch the session

Replays are typically available within minutes of capture.

## Privacy Considerations

### Masking Sensitive Data

To mask sensitive data in replays, you can configure privacy settings in `lib/amplitude/browser.ts`:

```typescript
sessionReplayPluginInstance = sessionReplayPlugin({
  sampleRate,
  privacyConfig: {
    // Add CSS selectors for elements to mask
    maskAllInputs: true,
    maskAllText: false,
    // Custom selectors
    maskSelectors: [
      '[data-sensitive]',
      '.password-field',
      '#credit-card-input',
    ],
  },
  applyBackgroundColorToBlockedElements: true, // Visual indicator
});
```

### User Opt-Out

Session Replay respects the Browser SDK's `optOut` setting. To opt out a user:

```typescript
import * as amplitude from '@amplitude/analytics-browser';

amplitude.setOptOut(true);
```

## Troubleshooting

### Replays Not Appearing

1. **Check API Key**: Ensure `NEXT_PUBLIC_AMPLITUDE_API_KEY` is set correctly
2. **Check Sample Rate**: Verify the sample rate isn't too low
3. **Check Browser Console**: Look for initialization errors
4. **Verify Device ID**: Ensure the same device ID is used for both Browser SDK and server-side tracking

### CSS Not Loading in Replays

1. **Check CORS**: Ensure `app.amplitude.com` is allowed in your CORS configuration
2. **Check Stylesheet Access**: Add `crossorigin="anonymous"` to stylesheet links
3. **Check CDN**: Ensure old stylesheets are available for older replays

### Performance Issues

1. **Reduce Sample Rate**: Lower the sample rate if experiencing performance issues
2. **Check IndexedDB**: Clear IndexedDB if storage is full
3. **Monitor Network**: Check network tab for excessive requests

## Known Limitations

- Session Replay doesn't capture Canvas, WebGL, or iframes from different origins
- Replays are project-specific (can't stitch together replays across projects)
- Requires Browser SDK (not compatible with server-only tracking)
- May not work with all browser extensions

## Best Practices

1. **Start with Low Sample Rate**: Begin with 1% and increase as needed
2. **Monitor Quota Usage**: Track your monthly quota usage in Amplitude
3. **Mask Sensitive Data**: Always mask passwords, credit cards, and PII
4. **Test in Development**: Use 100% sample rate in development for testing
5. **Review Regularly**: Check replays regularly to understand user behavior

## Additional Resources

- [Amplitude Session Replay Documentation](https://docs.amplitude.com/data/session-replay/)
- [Session Replay Settings](https://docs.amplitude.com/admin/account-management/account-settings#session-replay-settings)
- [Privacy and Masking](https://docs.amplitude.com/data/session-replay/session-replay-mask-data)







