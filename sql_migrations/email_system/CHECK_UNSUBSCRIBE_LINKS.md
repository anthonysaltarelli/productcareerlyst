# How to Verify Unsubscribe Links in Marketing Emails

## Quick Answer: Which Template to Use?

**Use one of these templates that support unsubscribe links:**
1. **`trial_welcome`** - Uses `TrialWelcomeEmail` component ✅
2. **`test_sequence_email`** - Uses `TestSequenceEmail` component ✅
3. Any template using `TrialWelcomeEmailV2` component ✅

## Requirements for Unsubscribe Links to Appear

### 1. Template Must Have `email_type: 'marketing'` in Metadata

Check your template:
```sql
SELECT 
  name, 
  metadata->>'email_type' as email_type,
  metadata->>'component_path' as component_path
FROM email_templates
WHERE is_active = true;
```

**Required**: `email_type` must be `'marketing'` (not `'transactional'`)

### 2. Template Must Use a Component That Supports Unsubscribe

The component must accept `unsubscribeUrl` prop. Supported components:
- `@/app/components/emails/TrialWelcomeEmail` ✅
- `@/app/components/emails/TrialWelcomeEmailV2` ✅
- `@/app/components/emails/TestSequenceEmail` ✅

### 3. Must Provide `userId` When Scheduling

**CRITICAL**: The unsubscribe URL is only generated if `userId` is provided!

When scheduling via API:
```typescript
{
  userId: "user-uuid-here",  // ← REQUIRED for unsubscribe link!
  emailAddress: "user@example.com",
  templateId: "...",
  // ...
}
```

## Step-by-Step: Verify Your Template Setup

### Step 1: Check Template Metadata

Run this SQL query:
```sql
SELECT 
  id,
  name,
  subject,
  metadata->>'email_type' as email_type,
  metadata->>'component_path' as component_path,
  is_active
FROM email_templates
WHERE name = 'trial_welcome'  -- or your template name
ORDER BY version DESC
LIMIT 1;
```

**Expected Result**:
- `email_type` = `'marketing'`
- `component_path` = `'@/app/components/emails/TrialWelcomeEmail'` (or similar)
- `is_active` = `true`

### Step 2: Fix Template if Needed

If your template doesn't have `email_type: 'marketing'`, update it:

```sql
UPDATE email_templates
SET metadata = jsonb_set(
  metadata,
  '{email_type}',
  '"marketing"'
)
WHERE name = 'trial_welcome'  -- your template name
  AND is_active = true;
```

### Step 3: Verify Component Path

Make sure the component path matches exactly:
```sql
UPDATE email_templates
SET metadata = jsonb_set(
  metadata,
  '{component_path}',
  '"@/app/components/emails/TrialWelcomeEmail"'
)
WHERE name = 'trial_welcome'
  AND is_active = true;
```

### Step 4: Schedule Email WITH userId

**Important**: When scheduling, you MUST provide `userId`:

```typescript
// ✅ CORRECT - Will generate unsubscribe link
await scheduleEmail({
  userId: "user-uuid-here",  // ← Required!
  emailAddress: "user@example.com",
  templateId: "template-uuid",
  // ...
});

// ❌ WRONG - Will NOT generate unsubscribe link
await scheduleEmail({
  // userId missing!
  emailAddress: "user@example.com",
  templateId: "template-uuid",
  // ...
});
```

## Testing: Verify Unsubscribe Link Appears

### Method 1: Check Database After Scheduling

After scheduling a marketing email, check if token was generated:

```sql
-- Check if unsubscribe token was created
SELECT 
  token,
  email_address,
  expires_at,
  used_at
FROM email_unsubscribe_tokens
ORDER BY created_at DESC
LIMIT 1;
```

If token exists → unsubscribe URL was generated ✅

### Method 2: Check Scheduled Email Record

```sql
-- Check the scheduled email metadata
SELECT 
  id,
  email_address,
  metadata->>'email_type' as email_type,
  template_snapshot->'metadata'->>'email_type' as template_email_type
FROM scheduled_emails
ORDER BY created_at DESC
LIMIT 1;
```

Should show `email_type: 'marketing'` ✅

### Method 3: Preview Email HTML

In the admin dashboard (`/admin/emails`):
1. Select a marketing template
2. Click "Preview" button
3. Check the HTML source
4. Look for: `<a href="...unsubscribe...">Unsubscribe from marketing emails</a>`

## Common Issues & Fixes

### Issue: No unsubscribe link in email

**Checklist**:
1. ✅ Template has `email_type: 'marketing'` in metadata?
2. ✅ Template uses component that supports `unsubscribeUrl` prop?
3. ✅ `userId` was provided when scheduling?
4. ✅ `NEXT_PUBLIC_APP_URL` environment variable is set?

**Fix**:
```sql
-- Update template to be marketing type
UPDATE email_templates
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{email_type}',
  '"marketing"'
)
WHERE name = 'your_template_name'
  AND is_active = true;
```

### Issue: Unsubscribe link is empty/null

**Cause**: `userId` not provided when scheduling

**Fix**: Always provide `userId` when scheduling marketing emails:
```typescript
await scheduleEmail({
  userId: user.id,  // ← Add this!
  emailAddress: user.email,
  // ...
});
```

### Issue: Template shows as "Transactional" in admin

**Fix**: Update template metadata:
```sql
UPDATE email_templates
SET metadata = jsonb_set(
  metadata,
  '{email_type}',
  '"marketing"'
)
WHERE id = 'your-template-id';
```

## Quick Test Template

If you need a test template, use this SQL:

```sql
-- Create/update test marketing template
INSERT INTO email_templates (
  name,
  subject,
  version,
  is_active,
  metadata
) VALUES (
  'test_marketing_email',
  'Test Marketing Email',
  1,
  true,
  jsonb_build_object(
    'component_path', '@/app/components/emails/TrialWelcomeEmail',
    'component_props', '{}'::jsonb,
    'email_type', 'marketing',
    'unsubscribe_url_placeholder', '{{unsubscribe_url}}'
  )
)
ON CONFLICT (name, version) 
DO UPDATE SET
  metadata = EXCLUDED.metadata,
  is_active = EXCLUDED.is_active;
```

Then use this template ID when scheduling emails.

## Verification Query

Run this to check all your marketing templates:

```sql
SELECT 
  name,
  subject,
  metadata->>'email_type' as email_type,
  metadata->>'component_path' as component,
  CASE 
    WHEN metadata->>'email_type' = 'marketing' THEN '✅ Marketing'
    WHEN metadata->>'email_type' = 'transactional' THEN 'ℹ️ Transactional'
    ELSE '⚠️ No type set'
  END as status
FROM email_templates
WHERE is_active = true
ORDER BY name;
```

All marketing templates should show `✅ Marketing` status.



