---
name: Replace trial sequence email logic with Inngest
overview: Remove all trial sequence email triggering and cancelling logic from Stripe API routes and replace with Inngest event-driven functions. Trigger ONLY from create-subscription route (single source of truth). Keep cancellation in all upgrade detection points (create-subscription, webhook, update-subscription).
todos:
  - id: install-inngest
    content: "Install Inngest packages: npm install inngest && npm install -D inngest-cli"
    status: pending
  - id: setup-inngest-mcp
    content: "Add Inngest MCP server for testing: claude mcp add --transport http inngest-dev http://127.0.0.1:8288/mcp"
    status: pending
  - id: create-inngest-client
    content: "Create lib/inngest/client.ts with Inngest client instance (app ID: productcareerlyst)"
    status: pending
  - id: create-inngest-webhook
    content: Create app/api/inngest/route.ts webhook endpoint using serve() from inngest/next, register both functions
    status: pending
  - id: create-trigger-function
    content: "Create lib/inngest/functions/trial-emails.ts with triggerTrialSequence function (event: trial/subscription.created) with 3 retries"
    status: pending
  - id: create-cancel-function
    content: "Create lib/inngest/functions/trial-emails.ts with cancelTrialSequence function (event: trial/subscription.cancelled) with 3 retries"
    status: pending
  - id: update-create-subscription-trigger
    content: Replace trial sequence triggering logic in create-subscription route with fire-and-forget Inngest event (idempotency key, try-catch)
    status: pending
  - id: update-create-subscription-cancel
    content: Replace trial sequence cancellation logic in create-subscription route with fire-and-forget Inngest event
    status: pending
  - id: remove-create-subscription-helpers
    content: Remove triggerTrialSequence and cancelTrialSequence helper functions from create-subscription route
    status: pending
  - id: remove-webhook-trigger
    content: Remove ENTIRE trial sequence triggering block from webhook route - no longer needed
    status: pending
  - id: update-webhook-cancel
    content: Replace trial sequence cancellation logic in webhook route with fire-and-forget Inngest event
    status: pending
  - id: remove-webhook-helpers
    content: Remove triggerTrialSequence and cancelTrialSequence helper functions from webhook route
    status: pending
  - id: update-update-subscription-cancel
    content: Replace trial sequence cancellation logic in update-subscription route with fire-and-forget Inngest event
    status: pending
  - id: remove-update-subscription-helpers
    content: Remove cancelTrialSequence helper function from update-subscription route
    status: pending
  - id: cleanup-imports
    content: Remove unused imports (generateFlowTriggerId, getAllFlows) from all modified files
    status: pending
  - id: add-env-vars
    content: Document environment variables for local dev vs production
    status: pending
  - id: test-local-trigger
    content: "Test via MCP: Use send_event to trigger trial/subscription.created, verify with poll_run_status and DB query"
    status: pending
  - id: test-local-cancel
    content: "Test via MCP: Use send_event to trigger trial/subscription.cancelled, verify with poll_run_status and DB query"
    status: pending
  - id: test-idempotency
    content: "Test via MCP: Send same event twice with same idempotency key, verify only one execution"
    status: pending
  - id: test-admin-page
    content: Test admin emails page manual cancellation still works (uses direct API)
    status: pending
---

# Replace Trial Sequence Email Logic with Inngest

## Overview

Replace all direct trial sequence email scheduling/cancelling with Inngest event-driven functions. This solves the production issue where serverless functions terminate before async work completes.

**Key Decision: Single Trigger Point**

- Trigger ONLY from `create-subscription` route (immediate, reliable with Inngest)
- Remove ALL trigger logic from webhook (no longer needed as backup)
- Keep cancellation in all upgrade detection points

**Key Design Principle: Fire and Forget**

- Event sends are wrapped in try-catch - failures are logged but don't break the main flow
- Inngest handles retries, persistence, and delivery guarantees
- The subscription flow succeeds even if Inngest is temporarily unavailable

## Current Implementation Locations

### Triggering Locations (REMOVE ALL):

1. **app/api/stripe/create-subscription/route.ts** (lines 219-244): Triggers on trial subscription creation → **REPLACE with Inngest**
2. **app/api/stripe/webhook/route.ts** (lines 543-610): Triggers as backup → **REMOVE ENTIRELY**

### Cancelling Locations (REPLACE ALL):

1. **app/api/stripe/create-subscription/route.ts** (lines 437-445): Cancels when upgrading from trial to active → **REPLACE with Inngest**
2. **app/api/stripe/webhook/route.ts** (lines 535-541): Cancels when upgrading from trial to active → **REPLACE with Inngest**
3. **app/api/billing/update-subscription/route.ts** (lines 298-305): Cancels when upgrading from trial to active → **REPLACE with Inngest**

### Helper Functions to Remove:

- `triggerTrialSequence()` in create-subscription (lines 482-570)
- `cancelTrialSequence()` in create-subscription (lines 575-595)
- `triggerTrialSequence()` in webhook (lines 620-677) → **REMOVE ENTIRELY**
- `cancelTrialSequence()` in webhook (lines 684-704)
- `cancelTrialSequence()` in update-subscription (lines 329-349)

### Admin Emails Page:

- Uses `/api/email/flows/cancel` which calls `cancelSequence()` directly
- No changes needed - continues to work as-is

## Implementation Steps

### 1. Install Inngest

Add Inngest dependencies:

```bash
npm install inngest
npm install -D inngest-cli
```

### 2. Setup Inngest MCP for Testing

Add the Inngest MCP server to enable AI-assisted testing:

```bash
claude mcp add --transport http inngest-dev http://127.0.0.1:8288/mcp
```

This provides tools for:
- `send_event` - Trigger functions with test events
- `list_functions` - Discover all registered functions
- `invoke_function` - Execute functions synchronously
- `get_run_status` - View detailed run information
- `poll_run_status` - Monitor runs until completion

### 3. Create Inngest Client

**File: `lib/inngest/client.ts`** (new file)

- Create Inngest client instance with app ID: `'productcareerlyst'`
- Export for use across the app
- No environment variables needed for client creation

### 4. Create Inngest Webhook Endpoint

**File: `app/api/inngest/route.ts`** (new file)

- Use `serve()` from `inngest/next` to create webhook endpoint
- Register both trial email functions (trigger and cancel)
- Handles Inngest's function discovery and execution
- This is the endpoint Inngest calls to execute functions

### 5. Create Inngest Functions

**File: `lib/inngest/functions/trial-emails.ts`** (new file)

**Function 1: `triggerTrialSequence`**

- Event: `trial/subscription.created`
- Payload: `{ userId: string, email: string, subscriptionId: string }`
- **Retries: 3** (explicit configuration)
- Logic: Move existing `triggerTrialSequence` logic from create-subscription route
- Uses existing `scheduleSequence()` from `lib/email/service`
- Includes all logging, error handling, and duplicate prevention
- Gets flow, generates flow_trigger_id, checks for existing emails, schedules if none exist

```typescript
export const triggerTrialSequence = inngest.createFunction(
  {
    id: 'trigger-trial-sequence',
    retries: 3,
  },
  { event: 'trial/subscription.created' },
  async ({ event, step }) => {
    // ... implementation
  }
);
```

**Function 2: `cancelTrialSequence`**

- Event: `trial/subscription.cancelled`
- Payload: `{ userId: string }`
- **Retries: 3** (explicit configuration)
- Logic: Move existing `cancelTrialSequence` logic from all routes
- Uses existing `cancelSequence()` from `lib/email/service`
- Includes all logging and error handling
- Gets flow, calls cancelSequence with userId and flowId

```typescript
export const cancelTrialSequence = inngest.createFunction(
  {
    id: 'cancel-trial-sequence',
    retries: 3,
  },
  { event: 'trial/subscription.cancelled' },
  async ({ event, step }) => {
    // ... implementation
  }
);
```

### 6. Update create-subscription Route

**File: `app/api/stripe/create-subscription/route.ts`**

**Remove:**

- Line 6: `generateFlowTriggerId` import (no longer needed)
- Lines 219-244: Trial sequence triggering logic (replace with Inngest event)
- Lines 437-445: Trial sequence cancellation logic (replace with Inngest event)
- Lines 482-595: Both `triggerTrialSequence()` and `cancelTrialSequence()` helper functions

**Add:**

- Import: `import { inngest } from '@/lib/inngest/client';`
- After subscription creation (line 209): Send Inngest event if trial subscription

**With idempotency key and fire-and-forget pattern:**
```typescript
if (trialPeriodDays && typeof trialPeriodDays === 'number' && trialPeriodDays > 0 && subscription.status === 'trialing') {
  try {
    await inngest.send({
      id: `trial-created-${subscription.id}`, // Idempotency key - prevents duplicate events on retry
      name: 'trial/subscription.created',
      data: {
        userId: user.id,
        email: user.email || '',
        subscriptionId: subscription.id,
      },
    });
    console.log('[create-subscription] Queued trial sequence trigger for user:', user.id);
  } catch (error) {
    // Fire and forget - log but don't fail the subscription
    console.error('[create-subscription] Failed to queue trial sequence trigger:', error);
  }
}
```

- In `syncSubscriptionToDatabase` (line 437): Send Inngest event if upgrade from trial
```typescript
if (isUpgradeFromTrial) {
  try {
    await inngest.send({
      id: `trial-cancelled-${userId}-${Date.now()}`, // Idempotency key
      name: 'trial/subscription.cancelled',
      data: { userId },
    });
    console.log('[create-subscription] Queued trial sequence cancellation for user:', userId);
  } catch (error) {
    console.error('[create-subscription] Failed to queue trial sequence cancellation:', error);
  }
}
```


### 7. Update webhook Route

**File: `app/api/stripe/webhook/route.ts`**

**Remove:**

- Line 6: `generateFlowTriggerId` import (no longer needed)
- Line 6: `getAllFlows` import (no longer needed)
- Lines 535-541: Trial sequence cancellation logic (replace with Inngest event)
- Lines 543-610: **ENTIRE trial sequence triggering block** (remove completely - no longer needed)
- Lines 620-704: Both `triggerTrialSequence()` and `cancelTrialSequence()` helper functions

**Add:**

- Import: `import { inngest } from '@/lib/inngest/client';`
- In `syncSubscriptionToDatabase` (line 535): Send Inngest event if upgrade from trial
```typescript
if (isUpgradeFromTrial) {
  try {
    await inngest.send({
      id: `trial-cancelled-webhook-${userId}-${Date.now()}`,
      name: 'trial/subscription.cancelled',
      data: { userId },
    });
    console.log('[webhook] Queued trial sequence cancellation for user:', userId);
  } catch (error) {
    console.error('[webhook] Failed to queue trial sequence cancellation:', error);
  }
}
```


**Note:** No trigger logic in webhook - create-subscription handles all triggering.

### 8. Update update-subscription Route

**File: `app/api/billing/update-subscription/route.ts`**

**Remove:**

- Lines 298-305: Trial sequence cancellation logic (replace with Inngest event)
- Lines 329-349: `cancelTrialSequence()` helper function
- Import of `getAllFlows` and `cancelSequence` if not used elsewhere

**Add:**

- Import: `import { inngest } from '@/lib/inngest/client';`
- After line 296: Send Inngest event if upgrade from trial
```typescript
if (isUpgradeFromTrial) {
  try {
    await inngest.send({
      id: `trial-cancelled-upgrade-${user.id}-${Date.now()}`,
      name: 'trial/subscription.cancelled',
      data: { userId: user.id },
    });
    console.log('[update-subscription] Queued trial sequence cancellation for user:', user.id);
  } catch (error) {
    console.error('[update-subscription] Failed to queue trial sequence cancellation:', error);
  }
}
```


### 9. Environment Variables

#### Local Development (no env vars needed!)

When using `npx inngest-cli dev`, no environment variables are required:
- The dev server runs locally at `http://127.0.0.1:8288`
- Events are sent to the local dev server automatically
- No API keys or signing keys needed

#### Production (Vercel)

**Add to Vercel environment variables:**

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `INNGEST_EVENT_KEY` | API key for sending events | Inngest Dashboard → Settings → Keys |
| `INNGEST_SIGNING_KEY` | Verifies webhook requests from Inngest | Inngest Dashboard → Settings → Keys |

**Note:** The `serve()` function from `inngest/next` automatically uses `INNGEST_SIGNING_KEY` to verify incoming webhook requests in production.

### 10. Inngest Dashboard Setup (Production)

1. Sign up at [inngest.com](https://inngest.com)
2. Create app: "productcareerlyst"
3. Add webhook URL: `https://yourdomain.com/api/inngest`
4. Copy `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to Vercel
5. Functions will auto-discover on first deployment

## Code Structure

### New Files:

```
lib/inngest/
  client.ts                    # Inngest client instance
  functions/
    trial-emails.ts           # triggerTrialSequence and cancelTrialSequence functions

app/api/inngest/
  route.ts                    # Inngest webhook endpoint (serves functions)
```

### Modified Files:

```
app/api/stripe/create-subscription/route.ts  # Replace trigger/cancel with Inngest events
app/api/stripe/webhook/route.ts              # Remove trigger, replace cancel with Inngest event
app/api/billing/update-subscription/route.ts # Replace cancel with Inngest event
package.json                                  # Add inngest dependency
```

## Event Flow

### Triggering Flow (Single Point):

1. User creates trial subscription → `create-subscription` route
2. Route sends Inngest event: `trial/subscription.created` with `{ userId, email, subscriptionId }` + idempotency key
3. Inngest function executes `triggerTrialSequence` (runs in your Next.js app)
4. Function calls `scheduleSequence()` with all existing logic
5. **No webhook trigger needed** - Inngest ensures execution

### Cancelling Flow (Multiple Detection Points):

1. Upgrade detected in `create-subscription` → sends `trial/subscription.cancelled`
2. Upgrade detected in `webhook` → sends `trial/subscription.cancelled`
3. Upgrade detected in `update-subscription` → sends `trial/subscription.cancelled`
4. Inngest function executes `cancelTrialSequence` (idempotent - safe to call multiple times)
5. Function calls `cancelSequence()` with all existing logic

## Duplicate Prevention

- **Event level:** Idempotency keys on `inngest.send()` prevent duplicate events if route retries
- **Function level:** Inngest functions use existing `flow_trigger_id` logic for idempotency
- **Database level:** `scheduleSequence()` already has duplicate prevention built-in (checks for existing flow_trigger_id)
- Multiple cancellation events are safe (idempotent operation)

## Testing Strategy

### Prerequisites

1. Start the Next.js dev server:
   ```bash
   npm run dev
   ```

2. Start the Inngest dev server (in a separate terminal):
   ```bash
   npx inngest-cli dev
   ```

3. Verify MCP is connected:
   ```bash
   # The MCP should already be added, but if not:
   claude mcp add --transport http inngest-dev http://127.0.0.1:8288/mcp
   ```

### Test 1: Trigger Trial Sequence

**Using Inngest MCP:**

1. Use `list_functions` to verify `trigger-trial-sequence` is registered
2. Use `send_event` to send a test event:
   ```json
   {
     "name": "trial/subscription.created",
     "data": {
       "userId": "test-user-123",
       "email": "test@example.com",
       "subscriptionId": "sub_test123"
     }
   }
   ```
3. Use `poll_run_status` to monitor execution until completion
4. Query the database to verify emails were scheduled:
   ```sql
   SELECT * FROM scheduled_emails WHERE user_id = 'test-user-123' ORDER BY created_at DESC;
   ```

**Expected result:** Emails scheduled in `scheduled_emails` table with correct flow_trigger_id

### Test 2: Cancel Trial Sequence

**Using Inngest MCP:**

1. Use `send_event` to send a cancellation event:
   ```json
   {
     "name": "trial/subscription.cancelled",
     "data": {
       "userId": "test-user-123"
     }
   }
   ```
2. Use `poll_run_status` to monitor execution
3. Query the database to verify emails were cancelled:
   ```sql
   SELECT * FROM scheduled_emails WHERE user_id = 'test-user-123' AND status = 'cancelled';
   ```

**Expected result:** All pending trial emails for user marked as cancelled

### Test 3: Idempotency

**Using Inngest MCP:**

1. Send the same event twice with the same idempotency key:
   ```json
   {
     "id": "test-idempotency-key",
     "name": "trial/subscription.created",
     "data": {
       "userId": "test-user-456",
       "email": "test2@example.com",
       "subscriptionId": "sub_test456"
     }
   }
   ```
2. Use `poll_run_status` to check runs
3. Query database for scheduled emails

**Expected result:** Only ONE set of emails scheduled, not duplicates

### Test 4: Fire-and-Forget Resilience

1. Stop the Inngest dev server
2. Make a subscription API call
3. Verify the subscription succeeds (not blocked by Inngest failure)
4. Check logs for the expected error message: "Failed to queue trial sequence trigger"

**Expected result:** Subscription flow completes, error is logged but not thrown

### Test 5: Admin Page Still Works

1. Navigate to admin emails page
2. Manually cancel a sequence
3. Verify it works (uses direct API, not Inngest)

**Expected result:** Admin manual cancellation unaffected by Inngest changes

### Test 6: End-to-End Flow

1. Use Stripe test mode to create a trial subscription
2. Monitor Inngest dev dashboard at `http://127.0.0.1:8288`
3. Verify function execution and email scheduling
4. Upgrade the subscription in Stripe
5. Verify cancellation function executes

## Benefits of Single Trigger Point

- Simpler: One place to trigger, easier to maintain
- Immediate: No delay waiting for webhook
- Reliable: Inngest guarantees execution even if function terminates
- No race conditions: No need for delays or duplicate checks between routes
- Clear ownership: create-subscription owns trial triggering

## Rollback Plan

- Keep existing code commented out initially
- Can revert by uncommenting and removing Inngest code
- Admin emails page continues to work regardless (uses direct API calls)

## References

- [Inngest MCP Documentation](https://www.inngest.com/docs/ai-dev-tools/mcp)
- [Inngest Dev Server MCP Announcement](https://www.inngest.com/blog/announcing-dev-server-mcp)
