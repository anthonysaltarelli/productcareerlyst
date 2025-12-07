# Email Outreach System with Resend API

## Overview

Build a comprehensive email outreach system leveraging Resend's scheduled email API, webhooks, and template system. The system will support single emails, multi-email sequences, cancellation logic, template versioning, A/B testing, and full visibility into scheduled/sent emails.

## Architecture Components

### 1. Database Schema

**New Tables:**

- `email_templates` - Store email templates with versioning
- Fields: id, name, subject, html_content, text_content, version, is_active, metadata (JSONB), created_at, updated_at
- Support for React Email components (store component path + props)

- `email_flows` - Define email sequences/flows
- Fields: id, name, description, trigger_event, cancel_events (JSONB array), is_active, created_at, updated_at
- Examples: "trial_sequence", "onboarding_followup", "upgrade_welcome"

- `email_flow_steps` - Individual emails within a sequence
- Fields: id, flow_id, step_order, days_offset, minutes_offset, template_id, template_version, subject_override, metadata (JSONB)
- `days_offset`: Days from trigger event (0 = immediate, 1 = +1 day, etc.) - Used in production
- `minutes_offset`: Minutes from trigger event (0 = immediate, 1 = +1 minute, etc.) - Used for testing

- `scheduled_emails` - Track all scheduled emails
- Fields: id, user_id, email_address, flow_id, flow_step_id, template_id, template_version, resend_email_id, resend_scheduled_id, status (pending/scheduled/sent/cancelled/failed), scheduled_at, sent_at, cancelled_at, metadata (JSONB), created_at, updated_at
- Indexes on user_id, status, scheduled_at, resend_email_id

- `email_events` - Track webhook events from Resend
- Fields: id, scheduled_email_id, resend_email_id, event_type (sent/delivered/opened/clicked/bounced/complained), event_data (JSONB), occurred_at, created_at
- Indexes on scheduled_email_id, resend_email_id, event_type

- `email_template_versions` - Track template changes for A/B testing
- Fields: id, template_id, version_name, subject, html_content, text_content, is_active, test_group (A/B), created_at
- Support for A/B testing different versions

**Location:** `sql_migrations/email_system/001_create_tables.sql`

### 2. Core Services

**Email Service (`lib/email/service.ts`)**

- `scheduleEmail()` - Schedule single email via Resend
- `scheduleSequence()` - Schedule entire email sequence
- `cancelEmail()` - Cancel single scheduled email
- `cancelSequence()` - Cancel all remaining emails in a sequence
- `cancelAllUserEmails()` - Cancel all scheduled emails for a user
- `getScheduledEmailsForUser()` - Get all scheduled emails for a user
- `getEmailHistory()` - Get send history with delivery status

**Template Service (`lib/email/templates.ts`)**

- `getTemplate()` - Get active template version
- `renderTemplate()` - Render React Email component to HTML
- `createTemplateVersion()` - Create new template version
- `activateTemplateVersion()` - Switch active version

**Flow Service (`lib/email/flows.ts`)**

- `getFlowByTrigger()` - Get flow definition by trigger event
- `shouldCancelFlow()` - Check if flow should be cancelled based on user events
- `getFlowSteps()` - Get all steps for a flow

**Webhook Handler (`lib/email/webhooks.ts`)**

- `handleResendWebhook()` - Process Resend webhook events
- `verifyWebhookSignature()` - Verify webhook authenticity using Resend SDK
- Update `scheduled_emails` status based on events
- Log events to `email_events` table

**Webhook Manager (`lib/email/webhook-manager.ts`)**

- `createDevelopmentWebhook()` - Create webhook for local development using Resend MCP
- `updateDevelopmentWebhook()` - Update webhook endpoint when ngrok URL changes
- `deleteDevelopmentWebhook()` - Clean up development webhook
- `getWebhookSecret()` - Retrieve webhook signing secret

**Location:** `lib/email/` directory

### 3. API Routes

**Email Management:**

- `POST /api/email/schedule` - Schedule single email or sequence
- `POST /api/email/cancel` - Cancel email(s)
- `GET /api/email/scheduled/:userId` - Get scheduled emails for user
- `GET /api/email/history/:userId` - Get email history for user
- `POST /api/email/test` - Send test email to personal account

**Template Management:**

- `GET /api/email/templates` - List all templates
- `GET /api/email/templates/:id` - Get template details
- `POST /api/email/templates` - Create new template
- `PATCH /api/email/templates/:id` - Update template
- `POST /api/email/templates/:id/versions` - Create template version

**Flow Management:**

- `GET /api/email/flows` - List all email flows
- `GET /api/email/flows/:id` - Get flow details with steps
- `POST /api/email/flows` - Create new flow
- `PATCH /api/email/flows/:id` - Update flow

**Webhook:**

- `POST /api/email/webhook` - Resend webhook endpoint
- Handle: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
- Verify webhook signature using Resend SDK
- Use raw request body for signature verification

**Webhook Management (Development):**

- `POST /api/email/webhooks/setup-dev` - Create/update development webhook (uses Resend MCP)
- `GET /api/email/webhooks/dev-status` - Get development webhook status
- `DELETE /api/email/webhooks/dev` - Delete development webhook

**Location:** `app/api/email/` directory

### 4. Integration Points (Phase 2 - Future)

**User Event Triggers:**

Create event listeners/hooks that trigger email flows (NOT in Phase 1):

- `onUserSignsUp()` → Schedule OTP email (immediate)
- `onUserConfirmsAccount()` → Schedule +1 day and +4 day follow-ups
- `onUserCompletesOnboarding()` → Schedule trial sequence (10 emails over 7+ days)
- `onUserUpgrades()` → Schedule welcome email, then +14 day NPS
- `onUserCreatesPortfolio()` → Schedule +14 day reminder if not published
- `onUserPublishesPortfolio()` → (no email, but could cancel reminder)
- `onUserAttemptsCancel()` → Schedule retention offer

**Location:**

- Event handlers in `lib/email/triggers.ts` (Phase 2)
- Integration in existing API routes (signup, onboarding, subscription webhooks, etc.) (Phase 2)

**Note:** Phase 1 focuses on dashboard testing only. Product integration happens in Phase 2.

### 5. Admin Dashboard (Phase 1 - Testing Focus)

**New Admin Page: `app/admin/emails/page.tsx`**

**Sections:**

1. **Email Flows Visualization**

- Visual flowchart showing all flows
- Display: flow name, trigger event, cancel events, steps with time offset
- Show both days_offset (production) and minutes_offset (testing) values
- Color-coded by status (active/inactive)
- **Manual Trigger Buttons**: Test trigger for each flow
- **Test Mode Toggle**: Switch between minutes (testing) and days (production) mode

2. **Manual Flow Testing**

- **Trigger Flow Button**: Manually trigger any flow for a selected user
- **Cancel Flow Button**: Manually cancel a flow for a user (tests cancel triggers)
- **User Selector**: Choose user to test with
- **Flow Selector**: Choose which flow to test
- **Test Mode Indicator**: Shows "Testing Mode: Minutes" or "Production Mode: Days"
- When in test mode, all time offsets use minutes (1 day = 1 minute)

3. **Scheduled Emails View**

- Table: User, Email, Flow, Step, Template, Scheduled At, Status
- Filters: User, Flow, Status, Date Range
- Actions: Cancel individual, Cancel sequence, Cancel all for user
- **Manual Cancel Buttons**: Test cancellation logic

4. **Email History**

- Table: User, Email, Subject, Sent At, Delivered, Opened, Clicked, Status
- Filters: User, Date Range, Status
- Show delivery status from Resend webhooks

5. **Template Management**

- List all templates with versions
- Edit templates (React Email components)
- Activate/deactivate versions
- A/B test configuration

6. **Test Email Sender**

- Form: Select template, enter test email, send
- Preview rendered HTML
- Use Resend test addresses: `delivered@resend.dev`, `bounced@resend.dev`, etc.

**Location:** `app/admin/emails/` directory

### 6. Resend Integration

**Configuration:**

- Use existing `RESEND_API_KEY` from env
- Set up webhook endpoint in Resend dashboard: `https://productcareerlyst.com/api/email/webhook`
- Subscribe to events: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained

**Scheduling:**

- Use `scheduledAt` parameter with ISO 8601 timestamps
- Calculate timestamps: 
  - Production: `triggerDate + daysOffset`
  - Testing: `triggerDate + minutesOffset` (1 day = 1 minute)
- Store `resend_email_id` from response for cancellation

**Cancellation:**

- Use `resend.emails.cancel(resend_email_id)` API
- Update `scheduled_emails.status = 'cancelled'`
- Handle errors gracefully (email may already be sent)

**Webhook Management (Using Resend MCP):**

- Use Resend MCP to programmatically manage webhooks for local development
- Create/update/delete webhooks via API during development
- Store webhook IDs for easy management

**Location:** `lib/email/resend-client.ts`

### 7. Initial Email Flows Implementation (Phase 1 - Testing)

**Priority 1: Trial Sequence**

- Flow: `trial_sequence`
- Trigger: `onboarding_completed` (manual in dashboard for Phase 1)
- Steps (Production - days_offset):
  - Day 0: Welcome to 7-day trial
  - Day 1: How to make the most of your trial
  - Day 2-5: Educational content (4 emails)
  - Day 6: Last day on trial
  - Day 7: Your trial ended
  - Day 14: Are you still interested?
  - Day 21: 50% discount
  - Day 28: 50% reminder + final email
- Steps (Testing - minutes_offset):
  - Minute 0: Welcome to 7-day trial
  - Minute 1: How to make the most of your trial
  - Minutes 2-5: Educational content (4 emails)
  - Minute 6: Last day on trial
  - Minute 7: Your trial ended
  - Minute 14: Are you still interested?
  - Minute 21: 50% discount
  - Minute 28: 50% reminder + final email
- Cancel triggers: `user_upgraded`, `subscription_created` (manual in dashboard for Phase 1)

**Priority 2: Single Emails**

- OTP email (immediate on signup) - Manual trigger in dashboard
- Account confirmation follow-ups (+1 day = +1 minute in test, +4 days = +4 minutes in test)
- Upgrade welcome email - Manual trigger in dashboard
- NPS email (+14 days = +14 minutes in test)

**Location:**

- Flow definitions: Database seed or migration
- Templates: `app/components/emails/` (extend existing)
- Both `days_offset` and `minutes_offset` stored in `email_flow_steps` table

### 8. Template System

**React Email Components:**

- Extend existing pattern from `NPSEmail.tsx`
- Store component path + props in database
- Render with `@react-email/render` at send time
- Support for dynamic variables: `{{firstName}}`, `{{userId}}`, etc.

**Versioning:**

- Each template can have multiple versions
- Track which version was sent in `scheduled_emails.template_version`
- Enable A/B testing by assigning users to test groups

**Location:** `app/components/emails/` (extend existing)

### 9. Error Handling & Reliability

- **Idempotency**: Use unique identifiers to prevent duplicate scheduling
- **Retry Logic**: Retry failed Resend API calls with exponential backoff
- **Status Tracking**: Always update database before/after Resend API calls
- **Webhook Verification**: Verify Resend webhook signatures
- **Graceful Degradation**: If Resend fails, log error but don't block user actions

### 10. Testing & Development

**Local Webhook Testing:**

1. **Tunnel Setup:**
   - Use ngrok or VS Code Port Forwarding to expose local server
   - Example: `ngrok http 3000` → `https://example123.ngrok.io`
   - Webhook endpoint: `https://example123.ngrok.io/api/email/webhook`

2. **Webhook Management via Resend MCP:**
   - Use Resend MCP to programmatically create/update webhooks
   - Create development webhook pointing to ngrok URL
   - Update webhook endpoint when ngrok URL changes
   - Delete development webhook when done testing
   - Store webhook ID for easy management

3. **Webhook Verification:**
   - Use `resend.webhooks.verify()` from Resend SDK
   - Verify using Svix headers: `svix-id`, `svix-timestamp`, `svix-signature`
   - Use raw request body (not parsed JSON) for verification
   - Store `RESEND_WEBHOOK_SECRET` from webhook details page

4. **Test Email Addresses:**
   - Use Resend test addresses for safe testing:
     - `delivered@resend.dev` - Simulates successful delivery
     - `bounced@resend.dev` - Simulates hard bounce
     - `complained@resend.dev` - Simulates spam complaint
     - `delayed@resend.dev` - Simulates delivery delay
   - Use labels: `delivered+signup@resend.dev` for tracking different flows

5. **Webhook Event Testing:**
   - Send test emails to test addresses
   - Verify webhook events are received and processed
   - Check `email_events` table for logged events
   - Verify `scheduled_emails` status updates

**Test Email Functionality:**

- Admin interface to send test emails
- Preview rendered templates
- Test scheduling with short delays (e.g., "in 1 minute")
- Use test email addresses for safe testing

**Development Mode:**

- Log all email operations to console
- Option to disable actual sending in dev
- Mock Resend responses for testing
- Auto-create/update development webhook on server start

## Implementation Phases

### Phase 1: Dashboard Testing (Initial Implementation)

**Goal:** Build complete email system with manual testing in admin dashboard. Use minutes instead of days for rapid iteration.

1. **Database Schema** - Create all tables and migrations
   - Add `minutes_offset` field to `email_flow_steps` for testing
   - Keep `days_offset` for production use later

2. **Core Services** - Email, Template, Flow services
   - Support both minutes_offset (testing) and days_offset (production)
   - Time offset selection based on test mode flag

3. **Resend Integration** - Client wrapper, scheduling, cancellation
   - Support both minutes and days for scheduling

4. **Webhook Handler** - Process Resend events
   - Webhook verification using Resend SDK
   - Local webhook testing setup with ngrok

5. **Webhook Management** - Use Resend MCP for local development
   - Create/update/delete webhooks programmatically
   - Auto-configure development webhook on server start
   - Store webhook configuration

6. **API Routes** - Email management endpoints
   - Manual trigger endpoints for testing
   - Test mode parameter support

7. **Admin Dashboard** - Testing-focused UI
   - Manual trigger buttons for each flow
   - Test mode toggle (minutes vs days)
   - Visual flow diagram with test controls
   - Schedule/cancel testing interface
   - Webhook status indicator

8. **Initial Flows** - Trial sequence + key single emails
   - Configure with minutes_offset for testing (e.g., +1 day = +1 minute)
   - Store both days_offset and minutes_offset in database

9. **Template System** - Create initial templates

10. **Testing Infrastructure** - Complete test email functionality
    - Test email sender with Resend test addresses
    - Webhook event testing and verification

### Phase 2: Product Integration (Future)

**Goal:** Integrate email triggers into actual user events in the product.

1. **Event Triggers** - Integrate with user events
   - Connect to signup, onboarding, upgrade, etc.
   - Switch from minutes_offset to days_offset

2. **Production Flows** - Update flows to use days_offset

3. **Monitoring** - Production monitoring and alerting

## Files to Create/Modify

**New Files:**

- `sql_migrations/email_system/001_create_tables.sql`
- `lib/email/service.ts`
- `lib/email/templates.ts`
- `lib/email/flows.ts`
- `lib/email/webhooks.ts`
- `lib/email/triggers.ts`
- `lib/email/resend-client.ts`
- `app/api/email/schedule/route.ts`
- `app/api/email/cancel/route.ts`
- `app/api/email/scheduled/[userId]/route.ts`
- `app/api/email/history/[userId]/route.ts`
- `app/api/email/test/route.ts`
- `app/api/email/templates/route.ts`
- `app/api/email/templates/[id]/route.ts`
- `app/api/email/flows/route.ts`
- `app/api/email/flows/[id]/route.ts`
- `app/api/email/webhook/route.ts`
- `app/admin/emails/page.tsx`
- `app/components/emails/TrialWelcomeEmail.tsx`
- `app/components/emails/TrialDay1Email.tsx`
- `app/components/emails/TrialLastDayEmail.tsx`
- `app/components/emails/TrialEndedEmail.tsx`
- `app/components/emails/UpgradeWelcomeEmail.tsx`
- `app/components/emails/OTPEmail.tsx` (if not exists)

**Modified Files (Phase 2):**

- `app/api/auth/signup/route.ts` (or wherever signup happens) - Add OTP email trigger (Phase 2)
- `app/api/onboarding/complete/route.ts` (or similar) - Add trial sequence trigger (Phase 2)
- `app/api/stripe/webhook/route.ts` - Add upgrade welcome email trigger (Phase 2)
- Existing email components - Ensure they follow template pattern

## Environment Variables

- `RESEND_API_KEY` (already exists)
- `RESEND_WEBHOOK_SECRET` (new - for webhook verification, get from Resend dashboard)
- `RESEND_FROM_EMAIL` (already exists)
- `NGROK_URL` (optional - for local development webhook testing)
- `NODE_ENV` - Use to determine test vs production mode

## Success Criteria

**Phase 1 (Dashboard Testing):**
- Can schedule single emails and sequences from admin dashboard
- Can cancel individual emails, sequences, or all user emails from dashboard
- Manual trigger buttons work for all flows
- Test mode (minutes) works correctly (1 day = 1 minute)
- Webhooks update email status in real-time during local testing
- Admin can view all scheduled emails and history
- Templates are versioned and editable
- Test emails can be sent from admin interface
- Visual flow diagram shows all email sequences
- Local webhook testing works with ngrok
- Resend MCP can manage webhooks programmatically

**Phase 2 (Product Integration):**
- Trial sequence triggers automatically on onboarding completion
- Cancellation logic works when user upgrades
- All flows use days_offset in production
- Production webhooks configured and verified