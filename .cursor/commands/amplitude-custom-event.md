# Add Custom Amplitude Event

Use this command when you need to track a custom event (not a button/link click or page view).

## Template

```tsx
import { trackEvent } from '@/lib/amplitude/client';

// In your handler function:
const handleAction = () => {
  const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
  const referrer = typeof window !== 'undefined' ? document.referrer : '';
  const referrerDomain = referrer ? new URL(referrer).hostname : null;
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  
  trackEvent('User [Action] [Object]', {
    'Page Route': pageRoute,
    'Referrer URL': referrer || 'None',
    'Referrer Domain': referrerDomain || 'None',
    'UTM Source': urlParams?.get('utm_source') || null,
    'UTM Medium': urlParams?.get('utm_medium') || null,
    'UTM Campaign': urlParams?.get('utm_campaign') || null,
    // Add event-specific properties here
    '[Property Name]': '[Property Value]',
  });
};
```

## Event Naming

Follow the pattern: `User [Action] [Object]` in Title Case

Examples:
- `User Selected Stage Of PM`
- `User Started Course`
- `User Completed Lesson`
- `User Applied To Job`

## Required Properties

Always include:
- `Page Route`: Current page path
- `Referrer URL`: Where user came from
- `Referrer Domain`: Referrer domain only
- UTM parameters (if available)

## Example: User Selected Stage

```tsx
const handleStageSelect = (stageType: string) => {
  const pageRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
  const referrer = typeof window !== 'undefined' ? document.referrer : '';
  const referrerDomain = referrer ? new URL(referrer).hostname : null;
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  
  trackEvent('User Selected Stage Of PM', {
    'Page Route': pageRoute,
    'Referrer URL': referrer || 'None',
    'Referrer Domain': referrerDomain || 'None',
    'UTM Source': urlParams?.get('utm_source') || null,
    'UTM Medium': urlParams?.get('utm_medium') || null,
    'UTM Campaign': urlParams?.get('utm_campaign') || null,
    'Stage Type': stageType,  // e.g., "Associate PM", "Senior PM"
    'Selection Context': 'Onboarding flow',
  });
};
```

