# Add Amplitude Tracking to Button

Use this command when you need to add Amplitude tracking to a button or link.

## Template

```tsx
import { TrackedButton } from '@/app/components/TrackedButton';
// or
import { TrackedLink } from '@/app/components/TrackedLink';

// For buttons:
<TrackedButton
  href="/destination-url"
  buttonId="[page]-[section]-[element-type]-[descriptor]"
  eventName="User Clicked [Action] Button"
  eventProperties={{
    'Button Section': '[Exact Section Name]',
    'Button Position': '[Exact Position]',
    'Button Text': '[Actual Button Text]',
    'Button Type': '[CTA Type]',
    'Button Context': '[What is around the button]',
    'Page Section': '[Above/Below the fold]',
  }}
>
  [Button Text]
</TrackedButton>

// For links:
<TrackedLink
  href="/destination-url"
  linkId="[page]-[section]-[context]-link"
  eventName="User Clicked [Action] Link"
  eventProperties={{
    'Link Section': '[Exact Section Name]',
    'Link Position': '[Exact Position]',
    'Link Text': '[Actual Link Text]',
    'Link Type': '[Link Type]',
    'Link Context': '[What is around the link]',
  }}
>
  [Link Text]
</TrackedLink>
```

## Required Information

1. **Unique ID**: Create following convention `[page]-[section]-[element-type]-[descriptor]`
2. **Event Name**: Follow "User [Action] [Object]" pattern in Title Case
3. **All Required Properties**: Section, Position, Text, Type, Context, Page Section

## Examples

### Homepage Hero Button
```tsx
<TrackedButton
  href="/auth/sign-up"
  buttonId="homepage-hero-primary-cta"
  eventName="User Clicked Sign Up Button"
  eventProperties={{
    'Button Section': 'Hero Section',
    'Button Position': 'Center of Hero Card',
    'Button Text': 'Start now for free →',
    'Button Type': 'Primary CTA',
    'Button Context': 'Below headline and outcome highlights',
    'Page Section': 'Above the fold',
  }}
>
  Start now for free →
</TrackedButton>
```

### Feature Card Link
```tsx
<TrackedLink
  href="/courses"
  linkId="homepage-features-pm-courses-link"
  eventName="User Clicked Courses Link"
  eventProperties={{
    'Link Section': 'Features Section',
    'Link Position': 'PM Courses Feature Card',
    'Link Text': 'Browse Courses →',
    'Link Type': 'Feature Card CTA',
    'Feature Card': 'PM Courses',
    'Card Position': 'First Feature Card',
  }}
>
  Browse Courses →
</TrackedLink>
```

