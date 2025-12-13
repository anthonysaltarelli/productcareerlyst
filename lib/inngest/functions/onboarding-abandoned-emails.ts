import { inngest } from '../client';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { getAllFlows, generateFlowTriggerId } from '@/lib/email/flows';
import { scheduleSequence } from '@/lib/email/service';

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
 * Trigger onboarding abandoned email flow for a user
 *
 * This function is called by Inngest when an onboarding/started event is sent.
 * It schedules the onboarding abandoned email sequence for the user.
 * The sequence will be cancelled if the user completes onboarding.
 */
export const triggerOnboardingAbandonedSequence = inngest.createFunction(
  {
    id: 'trigger-onboarding-abandoned-sequence',
    retries: 3,
  },
  { event: 'onboarding/started' },
  async ({ event, step }) => {
    const { userId, email: emailAddress } = event.data;

    console.log('[Inngest] triggerOnboardingAbandonedSequence called', { userId, emailAddress });

    // Step 1: Get the onboarding_abandoned flow
    const onboardingAbandonedFlow = await step.run('get-onboarding-abandoned-flow', async () => {
      const flows = await getAllFlows();
      const flow = flows.find((f) => f.name === 'onboarding_abandoned');

      if (!flow) {
        console.warn('[Inngest] onboarding_abandoned flow not found - skipping email scheduling');
        return null;
      }

      return flow;
    });

    if (!onboardingAbandonedFlow) {
      return { success: false, reason: 'onboarding_abandoned flow not found' };
    }

    if (!emailAddress) {
      console.warn('[Inngest] No email address provided - skipping email scheduling');
      return { success: false, reason: 'no email address' };
    }

    // Step 2: Check for existing emails (idempotency check)
    const existingEmails = await step.run('check-existing-emails', async () => {
      const supabase = getSupabaseAdmin();
      const flowTriggerId = generateFlowTriggerId(userId, onboardingAbandonedFlow.id, `onboarding-${userId}`);

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
      console.log(`[Inngest] Onboarding abandoned sequence already scheduled for user ${userId} - skipping`);
      return { success: true, reason: 'already scheduled', emailCount: existingEmails.length };
    }

    // Step 3: Get user's first name from profile (may not exist yet)
    const firstName = await step.run('get-user-profile', async () => {
      const supabase = getSupabaseAdmin();

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', userId)
          .maybeSingle();

        // Return null if no firstName, component will use fallback
        return profile?.first_name || null;
      } catch (error) {
        console.warn('[Inngest] Could not fetch user profile for firstName:', error);
        return null;
      }
    });

    // Step 4: Schedule the email sequence (insert into DB)
    const scheduledEmails = await step.run('schedule-sequence', async () => {
      const triggerEventId = `onboarding-${userId}`;
      const idempotencyKeyPrefix = `onboarding_abandoned_${userId}_${Date.now()}`;
      const flowTriggerId = generateFlowTriggerId(userId, onboardingAbandonedFlow.id, triggerEventId);

      // Auto-detect test mode based on environment
      // In development: use 1/1440 multiplier (1 minute = 1 day worth of production time)
      const isTestMode = process.env.NODE_ENV === 'development';
      const testModeMultiplier = isTestMode ? 1 / 1440 : 1;

      console.log('[Inngest] Scheduling onboarding abandoned sequence', {
        userId,
        emailAddress,
        flowId: onboardingAbandonedFlow.id,
        flowTriggerId,
        firstName,
        isTestMode,
        testModeMultiplier,
      });

      const emails = await scheduleSequence({
        userId,
        emailAddress,
        flowId: onboardingAbandonedFlow.id,
        idempotencyKeyPrefix,
        triggerEventId,
        variables: {
          firstName,
          userId,
        },
        isTest: isTestMode,
        testModeMultiplier,
      });

      return emails;
    });

    // Step 5: Process Resend scheduling (this ensures it runs to completion in Inngest)
    // The scheduleSequence function uses fire-and-forget for Resend calls which won't complete
    // in serverless environments. We need to explicitly wait for Resend scheduling here.
    await step.run('process-resend-scheduling', async () => {
      const { processResendSchedulingForEmails } = await import('@/lib/email/service');
      const supabase = getSupabaseAdmin();

      // Wait a moment for any fire-and-forget async processing to complete
      // This prevents duplicate Resend scheduling
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Re-fetch emails from DB to get actual current status
      // (the scheduledEmails variable has stale status from before async processing)
      const emailIds = scheduledEmails.map((e: any) => e.id);
      const { data: currentEmails, error } = await supabase
        .from('scheduled_emails')
        .select('*')
        .in('id', emailIds);

      if (error) {
        console.error('[Inngest] Error fetching current email status:', error);
        throw error;
      }

      // Only process emails that are still pending (not yet scheduled with Resend)
      const pendingEmails = (currentEmails || []).filter((e: any) => e.status === 'pending');

      if (pendingEmails.length === 0) {
        console.log('[Inngest] All emails already scheduled with Resend');
        return { processed: 0 };
      }

      console.log('[Inngest] Processing Resend scheduling for', pendingEmails.length, 'emails');

      await processResendSchedulingForEmails(pendingEmails, emailAddress);

      return { processed: pendingEmails.length };
    });

    console.log(`[Inngest] Successfully triggered onboarding abandoned sequence for user ${userId}`, {
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
 * Cancel onboarding abandoned email flow for a user
 *
 * This function is called by Inngest when an onboarding/completed event is sent.
 * It cancels all pending onboarding abandoned emails for the user.
 */
export const cancelOnboardingAbandonedSequence = inngest.createFunction(
  {
    id: 'cancel-onboarding-abandoned-sequence',
    retries: 3,
  },
  { event: 'onboarding/completed' },
  async ({ event, step }) => {
    const { userId } = event.data;

    console.log('[Inngest] cancelOnboardingAbandonedSequence called', { userId });

    // Step 1: Get the onboarding_abandoned flow
    const onboardingAbandonedFlow = await step.run('get-onboarding-abandoned-flow', async () => {
      const flows = await getAllFlows();
      const flow = flows.find((f) => f.name === 'onboarding_abandoned');

      if (!flow) {
        console.warn('[Inngest] onboarding_abandoned flow not found - skipping cancellation');
        return null;
      }

      return flow;
    });

    if (!onboardingAbandonedFlow) {
      return { success: false, reason: 'onboarding_abandoned flow not found' };
    }

    // Step 2: Cancel the sequence (updates DB immediately, returns cancelled emails)
    const cancelledEmails = await step.run('cancel-sequence', async () => {
      const supabase = getSupabaseAdmin();

      console.log('[Inngest] Cancelling onboarding abandoned sequence for user', {
        userId,
        flowId: onboardingAbandonedFlow.id,
      });

      // Find all pending/scheduled emails for this user and flow
      const { data: emails, error: fetchError } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('user_id', userId)
        .eq('flow_id', onboardingAbandonedFlow.id)
        .in('status', ['pending', 'scheduled']);

      if (fetchError) {
        console.error('[Inngest] Error fetching emails to cancel:', fetchError);
        throw fetchError;
      }

      if (!emails || emails.length === 0) {
        console.log('[Inngest] No emails to cancel');
        return [];
      }

      // Update status in database
      const emailIds = emails.map((e) => e.id);
      const { error: updateError } = await supabase
        .from('scheduled_emails')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .in('id', emailIds);

      if (updateError) {
        console.error('[Inngest] Error updating email status:', updateError);
        throw updateError;
      }

      console.log(`[Inngest] Marked ${emails.length} emails as cancelled in database`);
      return emails;
    });

    // Step 3: Process Resend cancellation (ensures API calls complete reliably)
    const resendResult = await step.run('process-resend-cancellation', async () => {
      if (cancelledEmails.length === 0) {
        return { cancelled: 0, failed: 0 };
      }

      const { processResendCancellationForEmails } = await import('@/lib/email/service');

      // Wait a moment for any fire-and-forget async processing to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Only process emails that have Resend IDs
      const emailsWithResendIds = cancelledEmails.filter(
        (e: any) => e.resend_email_id || e.resend_scheduled_id
      );

      if (emailsWithResendIds.length === 0) {
        console.log('[Inngest] No emails with Resend IDs to cancel');
        return { cancelled: 0, failed: 0 };
      }

      console.log('[Inngest] Processing Resend cancellation for', emailsWithResendIds.length, 'emails');

      return await processResendCancellationForEmails(emailsWithResendIds);
    });

    console.log(
      `[Inngest] Successfully cancelled ${cancelledEmails.length} emails in onboarding abandoned sequence for user ${userId}`,
      { resendResult }
    );

    return {
      success: true,
      cancelledCount: cancelledEmails.length,
      resendCancelled: resendResult.cancelled,
      resendFailed: resendResult.failed,
    };
  }
);
