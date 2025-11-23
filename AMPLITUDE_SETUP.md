# Amplitude Analytics Setup

This document describes the Amplitude analytics integration for Product Careerlyst.

## Overview

Amplitude is integrated to track both anonymous and authenticated user behavior across the application. The integration follows Amplitude's best practices for event and property naming conventions.

## Environment Setup

Add your Amplitude API keys to your environment variables:

```bash
# Required for server-side tracking
AMPLITUDE_API_KEY=your_amplitude_api_key_here
AMPLITUDE_API_SECRET_KEY=your_amplitude_api_secret_key_here

# Required for Session Replay (Browser SDK)
NEXT_PUBLIC_AMPLITUDE_API_KEY=your_amplitude_api_key_here

# Optional: Set server zone for Session Replay (US or EU)
NEXT_PUBLIC_AMPLITUDE_SERVER_ZONE=US
```

You can find your API key and secret key in your Amplitude project settings.

**Note**: `NEXT_PUBLIC_AMPLITUDE_API_KEY` should be the same as `AMPLITUDE_API_KEY` for Session Replay to work correctly with your existing events.

## Architecture

### Server-Side (`lib/amplitude/server.ts`)
- Initializes the Amplitude Node.js SDK
- Provides functions for server-side event tracking
- Handles user identification with email addresses

### Client-Side (`lib/amplitude/client.ts`)
- Provides client-side tracking utilities
- Automatically includes user email for authenticated users
- Uses Browser SDK when available (for Session Replay)
- Falls back to API routes for server-side tracking

### Browser SDK (`lib/amplitude/browser.ts`)
- Initializes Amplitude Browser SDK with Session Replay plugin
- Handles client-side event tracking for Session Replay
- Manages Session Replay collection and configuration

### API Route (`app/api/analytics/track/route.ts`)
- Receives tracking requests from client-side code
- Uses server-side Amplitude SDK to track events

## Naming Conventions

Following Amplitude's recommended patterns:

### Events
- **Format**: Title Case, `[Noun] [Past-Tense Verb]`
- **Examples**: 
  - `Page Viewed`
  - `Sign Up Clicked`
  - `Courses Link Clicked`

### Properties
- **Format**: Title Case, descriptive names
- **Examples**:
  - `Page Name`
  - `Button Location`
  - `Section Name`

## Usage

### Client-Side Tracking

```tsx
import { trackEvent } from '@/lib/amplitude/client';

// Track an event
trackEvent('Button Clicked', {
  'Button Name': 'Sign Up',
  'Page Name': 'Home',
});
```

### Using Tracked Components

We provide pre-built components for common tracking scenarios:

```tsx
import { TrackedLink } from '@/app/components/TrackedLink';
import { TrackedButton } from '@/app/components/TrackedButton';

// Tracked link
<TrackedLink
  href="/courses"
  eventName="Courses Link Clicked"
  eventProperties={{ 'Section': 'Features' }}
>
  Browse Courses
</TrackedLink>

// Tracked button
<TrackedButton
  href="/auth/sign-up"
  eventName="Sign Up Clicked"
  eventProperties={{ 'Button Location': 'Hero' }}
>
  Sign Up
</TrackedButton>
```

### Server-Side Tracking

```tsx
import { trackEvent } from '@/lib/amplitude/server';

// Track an event with optional user ID
await trackEvent('Order Completed', {
  'Order ID': '12345',
  'Total Amount': 99.99,
}, userEmail);
```

## User Identification

- **Anonymous Users**: Tracked with device ID (automatically handled by Amplitude)
- **Authenticated Users**: User ID is set to the user's email address
- User identification happens automatically when events are tracked from authenticated users

## Current Tracking Implementation

### Homepage (`app/page.tsx`)
- `Page Viewed` - When homepage loads
- `Sign Up Clicked` - When user clicks sign up buttons (with `Button Location` property)
- `Courses Link Clicked` - When user clicks courses link

## Adding New Tracking

1. **Define the event name** following the naming convention: `[Noun] [Past-Tense Verb]`
2. **Use TrackedLink or TrackedButton** for clickable elements
3. **Call trackEvent directly** for custom interactions
4. **Include relevant properties** in Title Case

## Testing

In development mode, Amplitude will log events to the console. Check your Amplitude dashboard to verify events are being received.

## Session Replay

Session Replay is enabled and automatically captures user sessions for replay in Amplitude. See [AMPLITUDE_SESSION_REPLAY.md](./AMPLITUDE_SESSION_REPLAY.md) for detailed information about:

- Session Replay configuration
- Sample rate settings
- Privacy and data masking
- Troubleshooting

## Resources

- [Amplitude Node.js SDK Documentation](https://developers.amplitude.com/docs/nodejs)
- [Amplitude Browser SDK Documentation](https://developers.amplitude.com/docs/browser)
- [Session Replay Documentation](https://docs.amplitude.com/data/session-replay/)
- [Amplitude Data Best Practices](https://developers.amplitude.com/docs/data-best-practices)

