# Email System - Resend Client

## Overview

This module provides the Resend client integration for the email system. It handles sending, scheduling, and canceling emails via the Resend API.

## Files

- `resend-client.ts` - Main Resend client with send, schedule, and cancel functions

## Functions

### `sendEmail(params: SendEmailParams)`

Send an email immediately via Resend.

**Parameters:**
- `to`: Recipient email address(es)
- `subject`: Email subject
- `html`: HTML content (optional)
- `text`: Plain text content (optional)
- `from`: Sender email (optional, defaults to `RESEND_FROM_EMAIL`)
- `replyTo`: Reply-to address(es) (optional)
- `headers`: Custom headers (optional)
- `tags`: Email tags (optional)

**Returns:** `{ id: string }` - Resend email ID

**Throws:** Error if API call fails or environment variables are missing

### `scheduleEmail(params: ScheduleEmailParams)`

Schedule an email for future delivery via Resend.

**Parameters:**
- All parameters from `sendEmail`
- `scheduledAt`: ISO 8601 timestamp for when to send the email

**Returns:** `{ id: string, scheduledId?: string }` - Resend email ID

**Throws:** Error if:
- API call fails
- `scheduledAt` is not in the future
- `scheduledAt` is more than 30 days in the future
- Environment variables are missing

### `cancelEmail(resendEmailId: string)`

Cancel a scheduled email via Resend.

**Parameters:**
- `resendEmailId`: The Resend email ID to cancel

**Returns:** `void`

**Throws:** Error if:
- API call fails
- Email not found or already sent/cancelled
- Environment variables are missing

### `calculateScheduledAt(baseDate?: Date, minutesOffset: number)`

Helper function to calculate scheduled timestamp from minutes offset.

**Parameters:**
- `baseDate`: Base date to calculate from (defaults to now)
- `minutesOffset`: Minutes to add (can be negative)

**Returns:** ISO 8601 timestamp string

## Environment Variables

Required:
- `RESEND_API_KEY` - Resend API key
- `RESEND_FROM_EMAIL` - Default sender email address

## Testing

Run the test script:

```bash
npx tsx scripts/test-resend-client.ts
```

Or with ts-node:

```bash
npx ts-node scripts/test-resend-client.ts
```

## Example Usage

```typescript
import { sendEmail, scheduleEmail, cancelEmail, calculateScheduledAt } from '@/lib/email/resend-client';

// Send immediately
const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome</h1>',
});

// Schedule for 2 minutes from now
const scheduledAt = calculateScheduledAt(new Date(), 2);
const scheduledResult = await scheduleEmail({
  to: 'user@example.com',
  subject: 'Reminder',
  html: '<p>This is a reminder</p>',
  scheduledAt,
});

// Cancel scheduled email
await cancelEmail(scheduledResult.id);
```



