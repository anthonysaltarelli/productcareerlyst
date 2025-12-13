# Create Email Flow Command

You are an expert at creating email sequences using Inngest, Resend, and Supabase. Help the user create a new email flow with proper scheduling and cancellation functionality.

## User Request
$ARGUMENTS

## Critical Learnings (MUST FOLLOW)

### 1. Fire-and-Forget DOES NOT Work in Serverless
Async fire-and-forget patterns fail silently in serverless environments (Vercel, Next.js API routes). When the HTTP response returns, the serverless function can terminate before background async work completes.

**Solution:** Use Inngest steps to ensure critical async work runs to completion in a durable context.

### 2. Inngest Steps Are Your Durability Boundary
Each `step.run()` is:
- Checkpointed (can resume if interrupted)
- Retried on failure
- Guaranteed to complete before the function reports success

**Required Pattern for ALL Inngest functions:**
```typescript
// Step N: Database operation (fast, returns immediately)
const records = await step.run('db-operation', async () => { ... });

// Step N+1: External API calls (slow, needs durability)
await step.run('process-external-api', async () => {
  // Wait for any fire-and-forget to settle
  await new Promise(resolve => setTimeout(resolve, 2000));
  // Re-fetch from DB to get actual current state
  // Process only what still needs processing
});
```

### 3. Race Conditions Between Steps
The scheduling step returns stale data (status: 'pending') but fire-and-forget may have already updated some records to 'scheduled'. The Resend processing step must:
- Add 2-second delay to let fire-and-forget settle
- Re-fetch from DB to get actual current status
- Only process records that still need processing

### 4. Resend Rate Limiting (2 req/sec)
Resend has a 2 requests/second limit. Use 600ms delay between calls (~1.67 req/sec) as a safe margin. This applies to BOTH scheduling AND cancellation.

### 5. Idempotency is Critical
- Use `flow_trigger_id` to prevent duplicate sequences
- Use Inngest event `id` for idempotency keys
- Check DB for existing records before scheduling

### 6. Environment-Based Test Mode
Auto-detect `NODE_ENV === 'development'` to use test timing (1 minute = 1 day) in the Inngest function itself.

### 7. Never Hardcode Fallback Names
Email components should handle null firstName with `"Hey there,"` - never use fallbacks like `'Test User'` or `'there'` in service code.

---

## Implementation Checklist

### Step 1: Create Email Template Components
Location: `app/components/emails/`

Create React Email components for each email in the sequence:

```typescript
// Example: app/components/emails/YourFlow1DayEmail.tsx
import * as React from 'react';

interface YourFlow1DayEmailProps {
  firstName?: string | null;
  baseUrl?: string;
  unsubscribeUrl?: string;
}

export const YourFlow1DayEmail = ({
  firstName,
  baseUrl = 'https://productcareerlyst.com',
  unsubscribeUrl,
}: YourFlow1DayEmailProps) => {
  // CRITICAL: Handle null firstName properly
  const greeting = firstName ? `Hey ${firstName},` : 'Hey there,';

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.6',
      color: '#222222',
      maxWidth: '600px',
    }}>
      <p style={{ margin: '0 0 16px 0' }}>{greeting}</p>

      {/* Email content */}

      <p style={{ margin: '0 0 16px 0' }}>
        Best,<br />
        Anthony Saltarelli<br />
        Founder, Product Careerlyst
      </p>

      {unsubscribeUrl && (
        <p style={{ margin: '24px 0 0 0', fontSize: '12px', color: '#999999' }}>
          <a href={unsubscribeUrl} style={{ color: '#999999' }}>
            Unsubscribe from marketing emails
          </a>
        </p>
      )}
    </div>
  );
};
```

### Step 2: Register Components in templates.ts
Location: `lib/email/templates.ts`

```typescript
// Add imports
import { YourFlow1DayEmail } from '@/app/components/emails/YourFlow1DayEmail';
import { YourFlow7DayEmail } from '@/app/components/emails/YourFlow7DayEmail';

// Add to COMPONENT_REGISTRY
const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  // ... existing
  '@/app/components/emails/YourFlow1DayEmail': YourFlow1DayEmail,
  '@/app/components/emails/YourFlow7DayEmail': YourFlow7DayEmail,
};
```

### Step 3: Add Inngest Event Types
Location: `lib/inngest/client.ts`

```typescript
type Events = {
  // ... existing events
  'your-flow/started': {
    data: {
      userId: string;
      email: string;
      // Add any flow-specific data
    };
  };
  'your-flow/completed': {
    data: {
      userId: string;
    };
  };
};
```

### Step 4: Create Inngest Functions
Location: `lib/inngest/functions/your-flow-emails.ts`

```typescript
import { inngest } from '../client';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { getAllFlows, generateFlowTriggerId } from '@/lib/email/flows';
import { scheduleSequence } from '@/lib/email/service';

const getSupabaseAdmin = () => {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

/**
 * Trigger your flow email sequence
 */
export const triggerYourFlowSequence = inngest.createFunction(
  {
    id: 'trigger-your-flow-sequence',
    retries: 3,
  },
  { event: 'your-flow/started' },
  async ({ event, step }) => {
    const { userId, email: emailAddress } = event.data;

    console.log('[Inngest] triggerYourFlowSequence called', { userId, emailAddress });

    // Step 1: Get the flow
    const flow = await step.run('get-flow', async () => {
      const flows = await getAllFlows();
      const foundFlow = flows.find((f) => f.name === 'your_flow_name');

      if (!foundFlow) {
        console.warn('[Inngest] your_flow_name flow not found');
        return null;
      }
      return foundFlow;
    });

    if (!flow) {
      return { success: false, reason: 'flow not found' };
    }

    if (!emailAddress) {
      return { success: false, reason: 'no email address' };
    }

    // Step 2: Check for existing emails (idempotency)
    const existingEmails = await step.run('check-existing-emails', async () => {
      const supabase = getSupabaseAdmin();
      const flowTriggerId = generateFlowTriggerId(userId, flow.id, `your-flow-${userId}`);

      const { data, error } = await supabase
        .from('scheduled_emails')
        .select('id')
        .eq('flow_trigger_id', flowTriggerId)
        .limit(1);

      if (error) throw error;
      return data || [];
    });

    if (existingEmails.length > 0) {
      return { success: true, reason: 'already scheduled', emailCount: existingEmails.length };
    }

    // Step 3: Get user's first name
    const firstName = await step.run('get-user-profile', async () => {
      const supabase = getSupabaseAdmin();
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', userId)
          .maybeSingle();

        return profile?.first_name || null; // Components handle fallback
      } catch (error) {
        return null;
      }
    });

    // Step 4: Schedule the sequence (DB insert)
    const scheduledEmails = await step.run('schedule-sequence', async () => {
      const triggerEventId = `your-flow-${userId}`;
      const idempotencyKeyPrefix = `your_flow_${userId}_${Date.now()}`;

      // CRITICAL: Auto-detect test mode
      const isTestMode = process.env.NODE_ENV === 'development';
      const testModeMultiplier = isTestMode ? 1 / 1440 : 1;

      console.log('[Inngest] Scheduling sequence', {
        userId, emailAddress, flowId: flow.id, isTestMode, testModeMultiplier,
      });

      const emails = await scheduleSequence({
        userId,
        emailAddress,
        flowId: flow.id,
        idempotencyKeyPrefix,
        triggerEventId,
        variables: { firstName, userId },
        isTest: isTestMode,
        testModeMultiplier,
      });

      return emails;
    });

    // Step 5: Process Resend scheduling (CRITICAL - ensures completion)
    await step.run('process-resend-scheduling', async () => {
      const { processResendSchedulingForEmails } = await import('@/lib/email/service');
      const supabase = getSupabaseAdmin();

      // Wait for fire-and-forget to settle
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Re-fetch to get actual current status
      const emailIds = scheduledEmails.map((e: any) => e.id);
      const { data: currentEmails, error } = await supabase
        .from('scheduled_emails')
        .select('*')
        .in('id', emailIds);

      if (error) throw error;

      // Only process pending emails
      const pendingEmails = (currentEmails || []).filter((e: any) => e.status === 'pending');

      if (pendingEmails.length === 0) {
        return { processed: 0 };
      }

      await processResendSchedulingForEmails(pendingEmails, emailAddress);
      return { processed: pendingEmails.length };
    });

    return {
      success: true,
      emailsScheduled: scheduledEmails.length,
      emailIds: scheduledEmails.map((e) => e.id),
    };
  }
);

/**
 * Cancel your flow email sequence
 */
export const cancelYourFlowSequence = inngest.createFunction(
  {
    id: 'cancel-your-flow-sequence',
    retries: 3,
  },
  { event: 'your-flow/completed' },
  async ({ event, step }) => {
    const { userId } = event.data;

    console.log('[Inngest] cancelYourFlowSequence called', { userId });

    // Step 1: Get the flow
    const flow = await step.run('get-flow', async () => {
      const flows = await getAllFlows();
      const foundFlow = flows.find((f) => f.name === 'your_flow_name');
      if (!foundFlow) return null;
      return foundFlow;
    });

    if (!flow) {
      return { success: false, reason: 'flow not found' };
    }

    // Step 2: Cancel in DB (returns emails for Resend cancellation)
    const cancelledEmails = await step.run('cancel-sequence', async () => {
      const supabase = getSupabaseAdmin();

      const { data: emails, error: fetchError } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('user_id', userId)
        .eq('flow_id', flow.id)
        .in('status', ['pending', 'scheduled']);

      if (fetchError) throw fetchError;
      if (!emails || emails.length === 0) return [];

      const emailIds = emails.map((e) => e.id);
      const { error: updateError } = await supabase
        .from('scheduled_emails')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .in('id', emailIds);

      if (updateError) throw updateError;
      return emails;
    });

    // Step 3: Process Resend cancellation (CRITICAL)
    const resendResult = await step.run('process-resend-cancellation', async () => {
      if (cancelledEmails.length === 0) {
        return { cancelled: 0, failed: 0 };
      }

      const { processResendCancellationForEmails } = await import('@/lib/email/service');

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const emailsWithResendIds = cancelledEmails.filter(
        (e: any) => e.resend_email_id || e.resend_scheduled_id
      );

      if (emailsWithResendIds.length === 0) {
        return { cancelled: 0, failed: 0 };
      }

      return await processResendCancellationForEmails(emailsWithResendIds);
    });

    return {
      success: true,
      cancelledCount: cancelledEmails.length,
      resendCancelled: resendResult.cancelled,
      resendFailed: resendResult.failed,
    };
  }
);
```

### Step 5: Register Inngest Functions
Location: `app/api/inngest/route.ts`

```typescript
import { triggerYourFlowSequence, cancelYourFlowSequence } from '@/lib/inngest/functions/your-flow-emails';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // ... existing functions
    triggerYourFlowSequence,
    cancelYourFlowSequence,
  ],
});
```

### Step 6: Database Migration (Supabase)
Run via Supabase MCP or SQL Editor:

```sql
-- 1. Create email templates
INSERT INTO email_templates (name, subject, version, is_active, metadata) VALUES
('your_flow_1day', 'Your subject line here', 1, true,
 '{"component_path": "@/app/components/emails/YourFlow1DayEmail", "email_type": "marketing"}'::jsonb),
('your_flow_7day', 'Another subject line', 1, true,
 '{"component_path": "@/app/components/emails/YourFlow7DayEmail", "email_type": "marketing"}'::jsonb);

-- 2. Create email flow
INSERT INTO email_flows (name, description, trigger_event, cancel_events, is_active) VALUES
('your_flow_name', 'Description of this flow',
 'your_flow_started', '["your_flow_completed"]'::jsonb, true);

-- 3. Get template and flow IDs, then create flow steps
-- Replace UUIDs with actual IDs from above inserts:
INSERT INTO email_flow_steps (flow_id, template_id, step_order, time_offset_minutes, template_version, email_type) VALUES
('FLOW_UUID', 'TEMPLATE_1_UUID', 1, 1440, 1, 'marketing'),   -- 1 day
('FLOW_UUID', 'TEMPLATE_2_UUID', 2, 10080, 1, 'marketing');  -- 7 days
```

### Step 7: Trigger Events from Your App
Location: Wherever the triggering action happens

```typescript
import { inngest } from '@/lib/inngest/client';

// Trigger the sequence
try {
  await inngest.send({
    id: `your-flow-started-${userId}`, // Idempotency key
    name: 'your-flow/started',
    data: {
      userId: user.id,
      email: user.email,
    },
  });
} catch (error) {
  // Fire and forget - log but don't fail
  console.error('Failed to trigger your-flow/started:', error);
}

// Cancel the sequence
try {
  await inngest.send({
    id: `your-flow-completed-${userId}-${Date.now()}`,
    name: 'your-flow/completed',
    data: {
      userId: user.id,
    },
  });
} catch (error) {
  console.error('Failed to trigger your-flow/completed:', error);
}
```

---

## Reference Files

- `lib/inngest/functions/onboarding-abandoned-emails.ts` - Working example
- `lib/inngest/functions/trial-emails.ts` - Working example
- `lib/email/service.ts` - scheduleSequence, processResendSchedulingForEmails, processResendCancellationForEmails
- `lib/email/templates.ts` - Template registry
- `lib/email/flows.ts` - Flow utilities
- `app/components/emails/OnboardingAbandoned15MinEmail.tsx` - Email component example

Now implement the user's requested email flow following this guide.
