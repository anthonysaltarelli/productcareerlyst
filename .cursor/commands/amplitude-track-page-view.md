# Add Amplitude Page View Tracking

Use this command when you need to add page view tracking to a page.

## Template

```tsx
import { PageTracking } from '@/app/components/PageTracking';

export default function YourPage() {
  return (
    <div>
      <PageTracking pageName="[Page Name]" />
      {/* Rest of page content */}
    </div>
  );
}
```

## Page Name Mapping

The component automatically maps page names to event names:
- `'Courses'` → `'User Viewed Courses Landing Page'`
- `'Sign Up'` → `'User Viewed Sign Up Page'`
- `'Login'` → `'User Viewed Login Page'`
- Other names → `'User Viewed [Page Name] Page'`

## Example

```tsx
import { PageTracking } from '@/app/components/PageTracking';

export default function SignUpPage() {
  return (
    <div>
      <PageTracking pageName="Sign Up" />
      {/* Page content */}
    </div>
  );
}
```

This automatically tracks:
- Event: `User Viewed Sign Up Page`
- Properties: Page Route, Page Name, Referrer URL/Domain, UTM parameters, Traffic Source

