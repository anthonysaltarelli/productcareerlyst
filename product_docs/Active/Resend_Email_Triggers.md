# Email Outreach System with Resend API

## Overview

Build a comprehensive email outreach system leveraging Resend's scheduled email API, webhooks, and template system. The system will support single emails, multi-email sequences, cancellation logic, template versioning, A/B testing, and full visibility into scheduled/sent emails.

## Key Features

- **Email Preferences & Unsubscribe**: Full compliance with CAN-SPAM/GDPR
  - Transactional vs Marketing email classification
  - Unsubscribe pages (unauthenticated) and Settings integration
  - Topic-level email preferences
  - Automatic cancellation of scheduled marketing emails on unsubscribe
- **ConvertKit Integration**: Two-way sync for newsletter
  - App ↔ ConvertKit synchronization
  - Webhook handling for unsubscribe/bounce/complaint
- **Idempotency & Race Conditions**: Production-ready reliability
  - Idempotency keys for all operations
  - Database transactions for atomicity
  - Duplicate prevention with unique constraints
- **Template Version Locking**: Templates locked at scheduling time
  - Template snapshots stored with scheduled emails
  - Updates only affect future emails
- **Test Mode Safeguards**: Safe testing in production
  - Single `time_offset_minutes` field with test multiplier
  - `is_test` flag and environment checks
  - Blocks test emails to non-test addresses in production

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
- Fields: id, flow_id, step_order, time_offset_minutes, template_id, template_version, subject_override, email_type (transactional/marketing), metadata (JSONB)
- `time_offset_minutes`: Minutes from trigger event (0 = immediate, 60 = +1 hour, 1440 = +1 day, etc.)
  - In test mode: use as-is (1 day = 1 minute for testing)
  - In production: use actual minutes (1440 = 1 day)
- `email_type`: 'transactional' or 'marketing' - determines if unsubscribe is required

- `scheduled_emails` - Track all scheduled emails
- Fields: id, user_id, email_address, flow_id, flow_step_id, template_id, template_version, template_snapshot (JSONB), resend_email_id, resend_scheduled_id, status (pending/scheduled/sent/cancelled/failed/suppressed), scheduled_at, sent_at, cancelled_at, suppression_reason, is_test (boolean), flow_trigger_id (text), triggered_at (timestamp), retry_count (integer), last_retry_at (timestamp), idempotency_key (text unique), metadata (JSONB), created_at, updated_at
- Indexes: user_id, status, scheduled_at, resend_email_id, flow_id+status, status+scheduled_at, user_id+flow_id+triggered_at, idempotency_key, email_address
- `template_snapshot`: Stores complete template data at time of scheduling (for version locking)
- `is_test`: Distinguishes test emails from production
- `flow_trigger_id`: Unique identifier for flow trigger instance (prevents duplicates)
- `idempotency_key`: Unique key for idempotent operations

- `email_events` - Track webhook events from Resend
- Fields: id, scheduled_email_id, resend_email_id, event_type (sent/delivered/opened/clicked/bounced/complained), event_data (JSONB), occurred_at, created_at
- Indexes on scheduled_email_id, resend_email_id, event_type

- `email_template_versions` - Track template changes for A/B testing
- Fields: id, template_id, version_name, subject, html_content, text_content, is_active, test_group (A/B), created_at
- Support for A/B testing different versions

- `user_email_preferences` - Store user email preferences and unsubscribe status
- Fields: id, user_id, email_address, marketing_emails_enabled (boolean), unsubscribed_at (timestamp), unsubscribe_reason (text), email_topics (JSONB array), convertkit_subscriber_id (text), convertkit_synced_at (timestamp), created_at, updated_at
- `email_topics`: Array of topic preferences, e.g., ["trial_sequence", "product_updates", "newsletter"]
- Unique constraint on user_id and email_address
- Indexes: user_id, email_address, marketing_emails_enabled

- `email_suppressions` - Track suppressed email addresses (bounced, complained, unsubscribed)
- Fields: id, email_address, reason (bounced/complained/unsubscribed), suppressed_at, user_id (nullable), metadata (JSONB), created_at
- Unique constraint on email_address
- Indexes: email_address, reason, suppressed_at

- `email_unsubscribe_tokens` - Secure tokens for unsubscribe links
- Fields: id, user_id, email_address, token (text unique), expires_at, used_at, created_at
- Indexes: token, user_id, email_address

**Location:** `sql_migrations/email_system/001_create_tables.sql`

### 2. Core Services

**Email Service (`lib/email/service.ts`)**

- `scheduleEmail()` - Schedule single email via Resend (with idempotency check)
- `scheduleSequence()` - Schedule entire email sequence (with transaction and duplicate prevention)
- `cancelEmail()` - Cancel single scheduled email
- `cancelSequence()` - Cancel all remaining emails in a sequence
- `cancelAllUserEmails()` - Cancel all scheduled emails for a user
- `cancelMarketingEmailsForUser()` - Cancel all marketing emails for a user (on unsubscribe)
- `getScheduledEmailsForUser()` - Get all scheduled emails for a user
- `getEmailHistory()` - Get send history with delivery status
- `checkEmailPreferences()` - Check if user can receive email (preferences + suppressions)
- `suppressEmailAddress()` - Add email to suppression list
- All scheduling operations use database transactions for atomicity
- All operations check idempotency keys to prevent duplicates

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

- `handleResendWebhook()` - Process Resend webhook events (idempotent)
- `verifyWebhookSignature()` - Verify webhook authenticity using Resend SDK
- Update `scheduled_emails` status based on events
- Log events to `email_events` table
- `handleBounceEvent()` - Auto-suppress email address on bounce
- `handleComplaintEvent()` - Auto-suppress email address on spam complaint
- `handleUnsubscribeEvent()` - Handle unsubscribe from email client
- Store webhook event IDs to prevent duplicate processing
- Handle webhooks for emails not yet in database (store by resend_email_id)

**Webhook Manager (`lib/email/webhook-manager.ts`)**

- `createDevelopmentWebhook()` - Create webhook for local development using Resend MCP
- `updateDevelopmentWebhook()` - Update webhook endpoint when ngrok URL changes
- `deleteDevelopmentWebhook()` - Clean up development webhook
- `getWebhookSecret()` - Retrieve webhook signing secret

**Email Preferences Service (`lib/email/preferences.ts`)**

- `getUserEmailPreferences()` - Get user's email preferences
- `updateEmailPreferences()` - Update user preferences (topics, marketing enabled)
- `unsubscribeUser()` - Unsubscribe user from marketing emails
  - Sets `marketing_emails_enabled = false` in `user_email_preferences`
  - **Cancels all scheduled marketing emails** for user:
    - Queries `scheduled_emails` for user with `email_type = 'marketing'` and `status IN ('pending', 'scheduled')`
    - Calls Resend API to cancel each email (`resend.emails.cancel()`)
    - Updates status to 'cancelled' with `suppression_reason = 'unsubscribed'`
    - Does NOT cancel transactional emails (`email_type = 'transactional'`)
  - Generates unsubscribe token for email link
  - Syncs to ConvertKit if newsletter was enabled
- `resubscribeUser()` - Resubscribe user to marketing emails
  - Sets `marketing_emails_enabled = true`
  - Clears `unsubscribed_at` timestamp
  - Syncs to ConvertKit if newsletter preference is enabled
- `cancelScheduledMarketingEmails()` - Cancel all scheduled marketing emails for user
  - Used by unsubscribe process
  - Atomic operation with database transaction
- `checkCanSendEmail()` - Check if email can be sent (preferences + suppressions)
  - Checks `user_email_preferences.marketing_emails_enabled` for marketing emails
  - Checks `email_suppressions` table for email address
  - Returns boolean: true if can send, false if blocked
- `syncToConvertKit()` - Sync preferences to ConvertKit (for newsletter)
  - If newsletter topic enabled: Subscribe to ConvertKit form 7348426
  - If newsletter topic disabled: Unsubscribe from ConvertKit
  - Updates `convertkit_subscriber_id` and `convertkit_synced_at`
- `syncFromConvertKit()` - Sync preferences from ConvertKit webhook
  - Handles ConvertKit unsubscribe webhook
  - Updates app preferences to match ConvertKit state

**ConvertKit Sync Service (`lib/email/convertkit-sync.ts`)**

- `syncUnsubscribeToConvertKit()` - Unsubscribe user in ConvertKit when unsubscribed in app
- `syncSubscribeToConvertKit()` - Subscribe user in ConvertKit when subscribed in app
- `handleConvertKitWebhook()` - Process ConvertKit webhooks (unsubscribe, bounce, etc.)
- `syncNewsletterPreference()` - Sync newsletter preference specifically
- Two-way sync: App ↔ ConvertKit for newsletter subscription

**Location:** `lib/email/` directory

### 3. API Routes

**Email Management:**

- `POST /api/email/schedule` - Schedule single email or sequence
  - Requires idempotency_key in body
  - Checks email preferences before scheduling
  - Uses database transaction for atomicity
  - Body: `{ flowId, userId, idempotencyKey, testMode?: boolean }`
- `POST /api/email/cancel` - Cancel email(s)
- `GET /api/email/scheduled/:userId` - Get scheduled emails for user
- `GET /api/email/history/:userId` - Get email history for user
- `POST /api/email/test` - Send test email (admin only, requires is_test flag)
  - Default: `anthsalt+<info>@gmail.com` (auto-generated label)
  - Optional: Accept manual email address override
  - Body: `{ templateId, email?: string, flowName?, stepName?, is_test: true }`
  - Validates test mode in production (blocks non-test addresses)

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
- Idempotent processing (check event ID to prevent duplicates)
- Auto-suppress on bounce/complaint

- `POST /api/email/convertkit-webhook` - ConvertKit webhook endpoint
- Handle: subscriber.subscriber_unsubscribe, subscriber.subscriber_bounce, subscriber.subscriber_complain
- Sync unsubscribe/bounce/complaint from ConvertKit to app
- Update user_email_preferences and email_suppressions

**Email Preferences:**

- `GET /api/email/preferences` - Get user's email preferences (authenticated)
- `PATCH /api/email/preferences` - Update user's email preferences (authenticated)
- `POST /api/email/unsubscribe/:token` - Unsubscribe via token (unauthenticated)
- `GET /api/email/unsubscribe/:token` - Unsubscribe page (unauthenticated)
- `POST /api/email/resubscribe/:token` - Resubscribe via token (unauthenticated)

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
- **User Selector**: Choose user to test with (for user context, but emails go to test address)
- **Flow Selector**: Choose which flow to test
- **Test Email Input**: Optional field to override default test email
  - Default: `anthsalt+<flow-name>@gmail.com` (e.g., `anthsalt+trial-sequence@gmail.com`)
  - Can manually enter custom email address
  - **Resend Test Addresses Dropdown**: Quick select for testing specific scenarios
- **Recipient Display**: Always show "All emails in this flow will be sent to: [email address]"
  - Display prominently before triggering flow
  - Update in real-time as admin changes email input
- **Test Mode Indicator**: Shows "Testing Mode: Minutes" or "Production Mode: Days"
- When in test mode, all time offsets use minutes (1 day = 1 minute)
- **Important**: All test emails sent to test address (default or manual), not the selected user's email
- **Recipient Confirmation**: Show recipient email in confirmation dialog before triggering flow

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

- Form: Select template, enter test email (optional), send
- **Recipient Display**: Always show the recipient email address prominently before sending
  - Display: "Test email will be sent to: [email address]"
  - Update in real-time as admin types or selects options
- **Default Test Email**: Always use `anthsalt+<info>@gmail.com` format
  - Auto-generate with label based on flow/template: `anthsalt+trial-welcome@gmail.com`, `anthsalt+upgrade-welcome@gmail.com`, etc.
  - Label format: `<flow-name>-<step-name>` or `<template-name>`
- **Manual Override**: Admin can manually enter custom email address
- **Resend Test Addresses Dropdown**: Quick select for testing specific scenarios
  - `delivered@resend.dev` - Test successful delivery
  - `bounced@resend.dev` - Test bounce handling
  - `complained@resend.dev` - Test spam complaint handling
  - `delayed@resend.dev` - Test delivery delay
- Preview rendered HTML before sending
- **Recipient Confirmation**: Show final recipient email in confirmation before sending

**Location:** `app/admin/emails/` directory

### 6.5. Unsubscribe Pages (Unauthenticated)

**Unsubscribe Page: `app/unsubscribe/[token]/page.tsx`**

- **Unsubscribe Success Page** (unauthenticated)
- Shows confirmation message after unsubscribe
- **Re-subscribe Button**: Allows user to resubscribe to marketing emails
- **Topic-Level Preferences**: 
  - Checkboxes for different email topics:
    - Trial sequence emails
    - Product updates
    - Newsletter (Product Careerlyst Newsletter)
    - Feature announcements
  - Save preferences button
- **Newsletter Sync**: 
  - If "Newsletter" is checked/unchecked, sync to ConvertKit
  - Uses ConvertKit API to subscribe/unsubscribe from form
- Token-based authentication (no login required)
- Token expires after 30 days
- One-time use tokens (mark as used after unsubscribe)

**Location:** `app/unsubscribe/[token]/` directory

### 6.6. Settings Page Integration

**Settings Page: `app/dashboard/settings/notifications/page.tsx`**

- **Email Notifications Section** in Settings
- Same functionality as unsubscribe page (but authenticated)
- **Global Marketing Toggle**: Enable/disable all marketing emails
- **Topic-Level Preferences**: Same checkboxes as unsubscribe page
- **Newsletter Preference**: 
  - Special handling for "Product Careerlyst Newsletter"
  - Syncs to ConvertKit when changed
  - Shows current ConvertKit subscription status
- **Unsubscribe History**: Show when user unsubscribed/resubscribed
- Real-time sync with `user_email_preferences` table
- Updates trigger cancellation of scheduled marketing emails if disabled

**Location:** `app/dashboard/settings/notifications/` directory

### 6. Resend Integration

**Configuration:**

- Use existing `RESEND_API_KEY` from env
- Set up webhook endpoint in Resend dashboard: `https://productcareerlyst.com/api/email/webhook`
- Subscribe to events: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained

**Scheduling:**

- Use `scheduledAt` parameter with ISO 8601 timestamps
- Calculate timestamps: `triggerDate + time_offset_minutes` (in minutes)
  - Production: Use actual minutes (1440 = 1 day)
  - Testing: Use test multiplier (1 minute = 1 day for testing)
- **Pre-Send Checks** (before scheduling):
  - Check `user_email_preferences.marketing_emails_enabled` for marketing emails
  - Check `email_suppressions` table for email address
  - Skip scheduling if user unsubscribed or email suppressed
  - Return early with status 'suppressed' if blocked
- **Pre-Send Checks** (before actual send via Resend):
  - Double-check preferences and suppressions at send time
  - If user unsubscribed between scheduling and send time, cancel email
  - This handles race condition where user unsubscribes after email is scheduled
- Store `resend_email_id` from response for cancellation
- Store complete template snapshot in `template_snapshot` field

**Cancellation:**

- Use `resend.emails.cancel(resend_email_id)` API
- Update `scheduled_emails.status = 'cancelled'`
- Handle errors gracefully (email may already be sent)
- **Unsubscribe Cancellation**: When user unsubscribes:
  - Cancel all scheduled marketing emails for that user
  - Update status to 'cancelled' with `suppression_reason = 'unsubscribed'`
  - Do NOT cancel transactional emails (OTP, password reset, etc.)

**Webhook Management (Using Resend MCP):**

- Use Resend MCP to programmatically manage webhooks for local development
- Create/update/delete webhooks via API during development
- Store webhook IDs for easy management

**Location:** `lib/email/resend-client.ts`

### 6.7. ConvertKit Integration & Sync

**Newsletter Sync Strategy:**

1. **Product Careerlyst Newsletter** (Form ID: 7348426)
   - Special email topic: "newsletter"
   - Two-way sync: App ↔ ConvertKit
   - When user subscribes in app → Subscribe to ConvertKit form
   - When user unsubscribes in app → Unsubscribe from ConvertKit
   - When ConvertKit webhook fires → Update app preferences

2. **ConvertKit Webhook Setup:**
   - Create webhook in ConvertKit dashboard
   - Events to subscribe:
     - `subscriber.subscriber_unsubscribe` - User unsubscribes in ConvertKit
     - `subscriber.subscriber_bounce` - Email bounces in ConvertKit
     - `subscriber.subscriber_complain` - User marks as spam in ConvertKit
   - Webhook URL: `https://productcareerlyst.com/api/email/convertkit-webhook`
   - Reference: https://developers.kit.com/api-reference/webhooks/create-a-webhook

3. **Sync Logic:**
   - **App → ConvertKit**: When user changes newsletter preference in app
     - If enabled: Add to ConvertKit form 7348426
     - If disabled: Remove from ConvertKit (unsubscribe)
   - **ConvertKit → App**: When webhook received
     - Update `user_email_preferences.marketing_emails_enabled = false`
     - Add to `email_suppressions` if bounce/complaint
     - Cancel scheduled marketing emails

4. **Store ConvertKit Subscriber ID:**
   - Store `convertkit_subscriber_id` in `user_email_preferences`
   - Track `convertkit_synced_at` timestamp
   - Use subscriber ID for future API calls

**Location:** `lib/email/convertkit-sync.ts`

### 7. Initial Email Flows Implementation (Phase 1 - Testing)

**Priority 1: Trial Sequence**

- Flow: `trial_sequence`
- Trigger: `onboarding_completed` (manual in dashboard for Phase 1)
- Steps (time_offset_minutes):
  - Production: 0, 1440, 2880-7200, 8640, 10080, 20160, 30240, 40320 (minutes)
  - Testing: 0, 1, 2-5, 6, 7, 14, 21, 28 (minutes, where 1 minute = 1 day)
  - Day 0 (0 min): Welcome to 7-day trial - **email_type: marketing**
  - Day 1 (1440 min / 1 min test): How to make the most of your trial - **email_type: marketing**
  - Days 2-5 (2880-7200 min / 2-5 min test): Educational content (4 emails) - **email_type: marketing**
  - Day 6 (8640 min / 6 min test): Last day on trial - **email_type: marketing**
  - Day 7 (10080 min / 7 min test): Your trial ended - **email_type: marketing**
  - Day 14 (20160 min / 14 min test): Are you still interested? - **email_type: marketing**
  - Day 21 (30240 min / 21 min test): 50% discount - **email_type: marketing**
  - Day 28 (40320 min / 28 min test): 50% reminder + final email - **email_type: marketing**
- Cancel triggers: `user_upgraded`, `subscription_created` (manual in dashboard for Phase 1)

**Priority 2: Single Emails**

- OTP email (immediate on signup) - **email_type: transactional** - Manual trigger in dashboard
- Account confirmation follow-ups (+1 day = +1 minute in test, +4 days = +4 minutes in test) - **email_type: marketing**
- Upgrade welcome email - **email_type: marketing** - Manual trigger in dashboard
- NPS email (+14 days = +14 minutes in test) - **email_type: marketing**

**Location:**

- Flow definitions: Database seed or migration
- Templates: `app/components/emails/` (extend existing)
- Single `time_offset_minutes` field in `email_flow_steps` table
- Test mode uses multiplier (1 minute = 1 day for display purposes)

### 8. Template System

**React Email Components:**

- Extend existing pattern from `NPSEmail.tsx`
- Store component path + props in database
- Render with `@react-email/render` at send time
- Support for dynamic variables: `{{firstName}}`, `{{userId}}`, etc.
- **Unsubscribe Link**: All marketing emails must include unsubscribe link
  - Format: `{{unsubscribe_url}}` or `{{unsubscribe_token}}`
  - Auto-injected for marketing emails
  - Links to `/unsubscribe/:token` page

**Versioning & Locking:**

- Each template can have multiple versions
- **CRITICAL: Template Version Locking**
  - When scheduling email, store complete template snapshot in `scheduled_emails.template_snapshot`
  - Store `template_version` in `scheduled_emails.template_version`
  - **Never update template for already-scheduled emails**
  - Only active template version is used for NEW schedules
  - Template updates only affect future emails, not scheduled ones
- Enable A/B testing by assigning users to test groups
- Track which version was sent in `scheduled_emails.template_version`

**Email Type Classification:**

- Each template and flow step must specify `email_type`: 'transactional' or 'marketing'
- Transactional: OTP, password reset, account updates (no unsubscribe required)
- Marketing: Trial sequence, newsletters, product updates (unsubscribe required)
- System enforces unsubscribe checks for marketing emails only

**Location:** `app/components/emails/` (extend existing)

### 9. Error Handling & Reliability

- **Idempotency**: 
  - All scheduling operations require `idempotency_key` (unique constraint)
  - Check for existing operation with same key before processing
  - Store idempotency_key in `scheduled_emails.idempotency_key`
  - Flow triggers use `flow_trigger_id` (user_id + flow_id + trigger_event_id) to prevent duplicates
- **Race Condition Prevention**:
  - Use database transactions for multi-step operations (scheduleSequence)
  - Use row-level locking for critical sections
  - Check for existing active flows before creating new ones
  - Handle concurrent triggers with unique constraints
- **Retry Logic**: 
  - Retry failed Resend API calls with exponential backoff
  - Track `retry_count` and `last_retry_at` in `scheduled_emails`
  - Max retries: 3 attempts
  - Dead letter queue for permanently failed emails
- **Status Tracking**: Always update database before/after Resend API calls
- **Webhook Verification**: Verify Resend webhook signatures
- **Webhook Idempotency**: Store webhook event IDs to prevent duplicate processing
- **Graceful Degradation**: If Resend fails, log error but don't block user actions
- **Test Mode Safeguards**:
  - Require `is_test: true` flag for test operations
  - In production, block test emails to non-test addresses
  - Environment variable check: `NODE_ENV === 'development'` or explicit test flag
  - Admin-only access for test operations

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
   - **Primary Test Email**: Always use `anthsalt+<info>@gmail.com` format
     - Auto-generate labels based on flow/template: `anthsalt+trial-welcome@gmail.com`, `anthsalt+upgrade-welcome@gmail.com`, etc.
     - Label format: `<flow-name>-<step-name>` or `<template-name>`
     - Gmail's plus addressing allows filtering and tracking
   - **Manual Override**: Admin can manually enter any email address in dashboard
   - **Resend Test Addresses** (for testing specific webhook scenarios):
     - `delivered@resend.dev` - Simulates successful delivery (triggers `email.delivered` webhook)
     - `bounced@resend.dev` - Simulates hard bounce (triggers `email.bounced` webhook)
     - `complained@resend.dev` - Simulates spam complaint (triggers `email.complained` webhook)
     - `delayed@resend.dev` - Simulates delivery delay
     - Available as quick-select dropdown in dashboard
   - **Recipient Visibility**: Always display recipient email address prominently before sending
     - Show in test email sender form
     - Show in flow trigger confirmation
     - Update in real-time as admin changes input
   - When manual email is provided, use that instead of default

5. **Webhook Event Testing:**
   - Send test emails to test addresses
   - Verify webhook events are received and processed
   - Check `email_events` table for logged events
   - Verify `scheduled_emails` status updates

**Test Email Functionality:**

- Admin interface to send test emails
- **Recipient Visibility**: Always show recipient email address clearly before sending
  - Display in form: "Test email will be sent to: [email address]"
  - Show in confirmation dialogs
  - Update in real-time as admin changes input
- **Default Test Email**: `anthsalt+<info>@gmail.com` with auto-generated labels
- **Manual Email Override**: Admin can enter custom email address
- **Resend Test Addresses**: Quick-select dropdown for testing specific webhook scenarios
- Preview rendered templates before sending
- Test scheduling with short delays (e.g., "in 1 minute")
- All test emails go to test address (default, manual, or Resend test address), never to actual user emails during testing

**Development Mode:**

- Log all email operations to console
- Option to disable actual sending in dev
- Mock Resend responses for testing
- Auto-create/update development webhook on server start

## Implementation Phases

### Phase 1: Dashboard Testing (Initial Implementation)

**Goal:** Build complete email system with manual testing in admin dashboard. Use minutes instead of days for rapid iteration.

1. **Database Schema** - Create all tables and migrations
   - Single `time_offset_minutes` field (not separate days/minutes)
   - Add email preferences and suppressions tables
   - Add unsubscribe tokens table
   - Add all missing fields to `scheduled_emails` (is_test, flow_trigger_id, etc.)

2. **Core Services** - Email, Template, Flow services
   - Single `time_offset_minutes` field with test mode multiplier
   - Email preferences service
   - ConvertKit sync service
   - Pre-send checks (preferences + suppressions)
   - Idempotency key handling
   - Transaction-based sequence scheduling

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
   - Configure with time_offset_minutes (use test multiplier for testing)
   - Mark email_type (transactional vs marketing) for each step
   - Include unsubscribe links in marketing emails

9. **Template System** - Create initial templates

10. **Testing Infrastructure** - Complete test email functionality
    - Test email sender with Resend test addresses
    - Webhook event testing and verification

11. **Unsubscribe System** - Unsubscribe pages and preferences
    - Unsubscribe page (unauthenticated)
    - Settings page integration
    - Token generation and validation

12. **ConvertKit Integration** - Two-way sync
    - ConvertKit webhook handler
    - Newsletter preference sync
    - Subscriber ID tracking

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
- `lib/email/preferences.ts`
- `lib/email/convertkit-sync.ts`
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
- `app/api/email/convertkit-webhook/route.ts`
- `app/api/email/preferences/route.ts`
- `app/api/email/unsubscribe/[token]/route.ts`
- `app/admin/emails/page.tsx`
- `app/unsubscribe/[token]/page.tsx`
- `app/dashboard/settings/notifications/page.tsx`
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
- `CONVERTKIT_API_KEY` (already exists)
- `CONVERTKIT_NEWSLETTER_FORM_ID` (7348426 - already exists)
- `CONVERTKIT_WEBHOOK_SECRET` (new - for ConvertKit webhook verification)
- `NGROK_URL` (optional - for local development webhook testing)
- `NODE_ENV` - Use to determine test vs production mode
- `EMAIL_TEST_MODE` (optional - explicit test mode flag)

## Success Criteria

**Phase 1 (Dashboard Testing):**
- Can schedule single emails and sequences from admin dashboard
- Can cancel individual emails, sequences, or all user emails from dashboard
- Manual trigger buttons work for all flows
- Test mode works correctly (time_offset_minutes with multiplier)
- Webhooks update email status in real-time during local testing
- Admin can view all scheduled emails and history
- Templates are versioned and editable (with version locking)
- Test emails can be sent from admin interface (with safeguards)
- Visual flow diagram shows all email sequences
- Local webhook testing works with ngrok
- Resend MCP can manage webhooks programmatically
- Unsubscribe system works (pages + settings)
- Email preferences are checked before sending
- ConvertKit sync works for newsletter
- Idempotency prevents duplicate sends
- Race conditions handled with transactions

**Phase 2 (Product Integration):**
- Trial sequence triggers automatically on onboarding completion
- Cancellation logic works when user upgrades
- All flows use days_offset in production
- Production webhooks configured and verified