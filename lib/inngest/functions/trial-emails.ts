import { inngest } from '../client';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { getAllFlows, generateFlowTriggerId } from '@/lib/email/flows';
import { scheduleSequence, cancelSequence } from '@/lib/email/service';

// Get service role Supabase client for admin operations
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
 * Trigger trial sequence email flow for a user
 *
 * This function is called by Inngest when a trial/subscription.created event is sent.
 * It schedules the trial email sequence for the user.
 */
export const triggerTrialSequence = inngest.createFunction(
  {
    id: 'trigger-trial-sequence',
    retries: 3,
  },
  { event: 'trial/subscription.created' },
  async ({ event, step }) => {
    const { userId, email: emailAddress, subscriptionId } = event.data;

    console.log('[Inngest] triggerTrialSequence called', { userId, emailAddress, subscriptionId });

    // Step 1: Get the trial_sequence flow
    const trialSequenceFlow = await step.run('get-trial-flow', async () => {
      const flows = await getAllFlows();
      const flow = flows.find((f) => f.name === 'trial_sequence');

      if (!flow) {
        console.warn('[Inngest] trial_sequence flow not found - skipping email scheduling');
        return null;
      }

      return flow;
    });

    if (!trialSequenceFlow) {
      return { success: false, reason: 'trial_sequence flow not found' };
    }

    if (!emailAddress) {
      console.warn('[Inngest] No email address provided - skipping email scheduling');
      return { success: false, reason: 'no email address' };
    }

    // Step 2: Check for existing emails (idempotency check)
    const existingEmails = await step.run('check-existing-emails', async () => {
      const supabase = getSupabaseAdmin();
      const flowTriggerId = generateFlowTriggerId(userId, trialSequenceFlow.id, subscriptionId);

      console.log('[Inngest] Checking for existing flow trigger', { flowTriggerId });

      const { data, error } = await supabase
        .from('scheduled_emails')
        .select('id')
        .eq('flow_trigger_id', flowTriggerId)
        .limit(1);

      if (error) {
        console.error('[Inngest] Error checking for existing emails:', error);
        throw error;
      }

      return data || [];
    });

    // If emails already exist, skip scheduling
    if (existingEmails.length > 0) {
      console.log(`[Inngest] Trial sequence already scheduled for user ${userId} - skipping`);
      return { success: true, reason: 'already scheduled', emailCount: existingEmails.length };
    }

    // Step 3: Get user's first name from profile
    const firstName = await step.run('get-user-profile', async () => {
      const supabase = getSupabaseAdmin();

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', userId)
          .maybeSingle();

        return profile?.first_name || 'there';
      } catch (error) {
        console.warn('[Inngest] Could not fetch user profile for firstName:', error);
        return 'there';
      }
    });

    // Step 4: Schedule the email sequence
    const scheduledEmails = await step.run('schedule-sequence', async () => {
      const triggerEventId = subscriptionId;
      const idempotencyKeyPrefix = `trial_sequence_${userId}_${subscriptionId}_${Date.now()}`;
      const flowTriggerId = generateFlowTriggerId(userId, trialSequenceFlow.id, triggerEventId);

      console.log('[Inngest] Scheduling trial sequence', {
        userId,
        emailAddress,
        flowId: trialSequenceFlow.id,
        flowTriggerId,
      });

      const emails = await scheduleSequence({
        userId,
        emailAddress,
        flowId: trialSequenceFlow.id,
        idempotencyKeyPrefix,
        triggerEventId,
        variables: {
          firstName,
          userId,
        },
        isTest: false,
        testModeMultiplier: 1,
      });

      return emails;
    });

    console.log(`[Inngest] Successfully triggered trial sequence for user ${userId}`, {
      emailsScheduled: scheduledEmails.length,
      emailIds: scheduledEmails.map((e) => e.id),
    });

    return {
      success: true,
      emailsScheduled: scheduledEmails.length,
      emailIds: scheduledEmails.map((e) => e.id),
    };
  }
);

/**
 * Cancel trial sequence email flow for a user
 *
 * This function is called by Inngest when a trial/subscription.cancelled event is sent.
 * It cancels all pending trial emails for the user.
 */
export const cancelTrialSequence = inngest.createFunction(
  {
    id: 'cancel-trial-sequence',
    retries: 3,
  },
  { event: 'trial/subscription.cancelled' },
  async ({ event, step }) => {
    const { userId } = event.data;

    console.log('[Inngest] cancelTrialSequence called', { userId });

    // Step 1: Get the trial_sequence flow
    const trialSequenceFlow = await step.run('get-trial-flow', async () => {
      const flows = await getAllFlows();
      const flow = flows.find((f) => f.name === 'trial_sequence');

      if (!flow) {
        console.warn('[Inngest] trial_sequence flow not found - skipping cancellation');
        return null;
      }

      return flow;
    });

    if (!trialSequenceFlow) {
      return { success: false, reason: 'trial_sequence flow not found' };
    }

    // Step 2: Cancel the sequence
    const cancelledCount = await step.run('cancel-sequence', async () => {
      console.log('[Inngest] Cancelling trial sequence for user', { userId, flowId: trialSequenceFlow.id });

      const count = await cancelSequence(undefined, userId, trialSequenceFlow.id);
      return count;
    });

    console.log(`[Inngest] Successfully cancelled ${cancelledCount} emails in trial sequence for user ${userId}`);

    return {
      success: true,
      cancelledCount,
    };
  }
);
