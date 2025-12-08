import { Resend } from 'resend';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import type { ScheduledEmail } from './service';

/**
 * Webhook Handler for Resend Email Events
 * 
 * Handles webhook events from Resend:
 * - email.sent - Email was sent successfully
 * - email.delivered - Email delivered to recipient's mail server
 * - email.opened - Recipient opened the email
 * - email.clicked - Recipient clicked a link
 * - email.bounced - Email bounced
 * - email.complained - Email marked as spam
 * 
 * Features:
 * - Signature verification using Resend SDK
 * - Idempotent event processing (prevents duplicates)
 * - Updates scheduled_emails status based on events
 * - Logs all events to email_events table
 * - Handles emails not yet in database (by resend_email_id)
 */

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

// Initialize Resend client for webhook verification
let resendClient: Resend | null = null;

const getResendClient = (): Resend => {
  if (resendClient) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is required');
  }

  resendClient = new Resend(apiKey);
  return resendClient;
};

/**
 * Resend webhook event types (from Resend API)
 */
export type ResendWebhookEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.opened'
  | 'email.clicked'
  | 'email.bounced'
  | 'email.complained'
  | 'email.scheduled';

/**
 * Database event type enum values
 */
type DatabaseEventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'scheduled';

/**
 * Map Resend webhook event type to database enum value
 */
const mapResendEventTypeToDatabase = (resendType: ResendWebhookEventType): DatabaseEventType => {
  // Remove 'email.' prefix to match database enum
  return resendType.replace('email.', '') as DatabaseEventType;
};

/**
 * Resend webhook event payload structure
 */
export interface ResendWebhookEvent {
  type: ResendWebhookEventType;
  created_at: string; // ISO 8601 timestamp
  data: {
    email_id: string; // Resend email ID
    from: string;
    to: string[];
    subject: string;
    created_at: string; // ISO 8601 timestamp
    [key: string]: any; // Additional event-specific data
  };
}

/**
 * Verify webhook signature using Resend SDK
 * 
 * CRITICAL: Must use raw request body (not parsed JSON) for verification
 * The cryptographic signature is sensitive to even the slightest change.
 * 
 * @param payload Raw request body as string
 * @param headers Request headers containing Svix headers
 * @param webhookSecret Webhook signing secret from Resend
 * @returns Parsed webhook event payload
 * @throws Error if signature verification fails
 */
export const verifyWebhookSignature = (
  payload: string,
  headers: {
    'svix-id'?: string | null;
    'svix-timestamp'?: string | null;
    'svix-signature'?: string | null;
  },
  webhookSecret: string
): ResendWebhookEvent => {
  const resend = getResendClient();

  // Verify webhook signature using Resend SDK
  // This throws an error if the webhook is invalid
  const result = resend.webhooks.verify({
    payload,
    headers: {
      id: headers['svix-id'] || '',
      timestamp: headers['svix-timestamp'] || '',
      signature: headers['svix-signature'] || '',
    },
    webhookSecret,
  });

  return result as ResendWebhookEvent;
};

/**
 * Check if event has already been processed (idempotency check)
 * 
 * Uses unique constraint on (resend_email_id, event_type, occurred_at)
 * 
 * @param resendEmailId Resend email ID
 * @param eventType Event type (Resend format: 'email.sent')
 * @param occurredAt When event occurred (from webhook)
 * @returns true if event already processed, false otherwise
 */
const isEventAlreadyProcessed = async (
  resendEmailId: string,
  eventType: ResendWebhookEventType,
  occurredAt: string
): Promise<boolean> => {
  const supabase = getSupabaseAdmin();

  // Map Resend event type to database enum value
  const dbEventType = mapResendEventTypeToDatabase(eventType);

  const { data, error } = await supabase
    .from('email_events')
    .select('id')
    .eq('resend_email_id', resendEmailId)
    .eq('event_type', dbEventType)
    .eq('occurred_at', occurredAt)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" which is expected
    console.error('Error checking for existing event:', error);
    // If check fails, assume not processed (safer to process twice than miss)
    return false;
  }

  return !!data;
};

/**
 * Log webhook event to email_events table
 * 
 * @param event Webhook event
 * @param scheduledEmailId Optional scheduled email ID (if found in database)
 * @returns Created event record ID
 */
const logWebhookEvent = async (
  event: ResendWebhookEvent,
  scheduledEmailId: string | null = null
): Promise<string> => {
  const supabase = getSupabaseAdmin();

  // Map Resend event type to database enum value
  const dbEventType = mapResendEventTypeToDatabase(event.type);

  const { data, error } = await supabase
    .from('email_events')
    .insert({
      scheduled_email_id: scheduledEmailId,
      resend_email_id: event.data.email_id,
      event_type: dbEventType,
      event_data: event.data,
      occurred_at: event.created_at,
    })
    .select('id')
    .single();

    if (error) {
      // If error is due to unique constraint, event was already processed
      if (error.code === '23505') {
        console.log(`[Webhook] Event already logged (idempotency): ${event.type} for ${event.data.email_id}`);
        // Fetch existing event
        const { data: existing } = await supabase
          .from('email_events')
          .select('id')
          .eq('resend_email_id', event.data.email_id)
          .eq('event_type', dbEventType)
          .eq('occurred_at', event.created_at)
          .single();

      if (existing) {
        return existing.id;
      }
    }
    throw new Error(`Failed to log webhook event: ${error.message}`);
  }

  if (!data) {
    throw new Error('Failed to log webhook event: No data returned');
  }

  return data.id;
};

/**
 * Find scheduled email by Resend email ID
 * 
 * @param resendEmailId Resend email ID
 * @returns Scheduled email record or null
 */
const findScheduledEmailByResendId = async (
  resendEmailId: string
): Promise<ScheduledEmail | null> => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('scheduled_emails')
    .select('*')
    .eq('resend_email_id', resendEmailId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error finding scheduled email:', error);
    return null;
  }

  return data as ScheduledEmail | null;
};

/**
 * Update scheduled email status
 * 
 * @param scheduledEmailId Scheduled email ID
 * @param status New status
 * @param additionalData Optional additional data to update
 */
const updateScheduledEmailStatus = async (
  scheduledEmailId: string,
  status: ScheduledEmail['status'],
  additionalData?: {
    sentAt?: string;
    suppressionReason?: 'bounced' | 'complained' | 'unsubscribed';
  }
): Promise<void> => {
  const supabase = getSupabaseAdmin();

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (additionalData?.sentAt) {
    updateData.sent_at = additionalData.sentAt;
  }

  if (additionalData?.suppressionReason) {
    updateData.suppression_reason = additionalData.suppressionReason;
  }

  const { error } = await supabase
    .from('scheduled_emails')
    .update(updateData)
    .eq('id', scheduledEmailId);

  if (error) {
    console.error('Error updating scheduled email status:', error);
    throw new Error(`Failed to update scheduled email status: ${error.message}`);
  }
};

/**
 * Handle email.sent event
 * Updates scheduled_emails status to 'sent' and sets sent_at timestamp
 */
const handleSentEvent = async (
  event: ResendWebhookEvent,
  scheduledEmail: ScheduledEmail | null
): Promise<void> => {
  if (!scheduledEmail) {
    console.log(`[Webhook] email.sent event for email not in database: ${event.data.email_id}`);
    return;
  }

  // Only update if status is pending or scheduled
  if (scheduledEmail.status !== 'pending' && scheduledEmail.status !== 'scheduled') {
    console.log(`[Webhook] email.sent event for email with status ${scheduledEmail.status}, skipping update`);
    return;
  }

  await updateScheduledEmailStatus(scheduledEmail.id, 'sent', {
    sentAt: event.created_at,
  });

  console.log(`[Webhook] Updated email ${scheduledEmail.id} status to 'sent'`);
};

/**
 * Handle email.delivered event
 * Email is already 'sent', so we just log the event (status remains 'sent')
 */
const handleDeliveredEvent = async (
  event: ResendWebhookEvent,
  scheduledEmail: ScheduledEmail | null
): Promise<void> => {
  if (!scheduledEmail) {
    console.log(`[Webhook] email.delivered event for email not in database: ${event.data.email_id}`);
    return;
  }

  // Delivered is just informational - email is already 'sent'
  // We could add a 'delivered' status in the future, but for now we keep it as 'sent'
  console.log(`[Webhook] Email ${scheduledEmail.id} delivered`);
};

/**
 * Handle email.opened event
 * Just log the event (no status change)
 */
const handleOpenedEvent = async (
  event: ResendWebhookEvent,
  scheduledEmail: ScheduledEmail | null
): Promise<void> => {
  if (!scheduledEmail) {
    console.log(`[Webhook] email.opened event for email not in database: ${event.data.email_id}`);
    return;
  }

  console.log(`[Webhook] Email ${scheduledEmail.id} opened`);
};

/**
 * Handle email.clicked event
 * Just log the event (no status change)
 */
const handleClickedEvent = async (
  event: ResendWebhookEvent,
  scheduledEmail: ScheduledEmail | null
): Promise<void> => {
  if (!scheduledEmail) {
    console.log(`[Webhook] email.clicked event for email not in database: ${event.data.email_id}`);
    return;
  }

  console.log(`[Webhook] Email ${scheduledEmail.id} clicked`);
};

/**
 * Handle email.bounced event
 * Updates scheduled_emails status to 'suppressed' with reason 'bounced'
 * Note: Auto-suppression logic will be handled in preferences service
 */
const handleBouncedEvent = async (
  event: ResendWebhookEvent,
  scheduledEmail: ScheduledEmail | null
): Promise<void> => {
  if (!scheduledEmail) {
    console.log(`[Webhook] email.bounced event for email not in database: ${event.data.email_id}`);
    return;
  }

  await updateScheduledEmailStatus(scheduledEmail.id, 'suppressed', {
    suppressionReason: 'bounced',
  });

  console.log(`[Webhook] Updated email ${scheduledEmail.id} status to 'suppressed' (bounced)`);
};

/**
 * Handle email.complained event
 * Updates scheduled_emails status to 'suppressed' with reason 'complained'
 * Note: Auto-suppression logic will be handled in preferences service
 */
const handleComplainedEvent = async (
  event: ResendWebhookEvent,
  scheduledEmail: ScheduledEmail | null
): Promise<void> => {
  if (!scheduledEmail) {
    console.log(`[Webhook] email.complained event for email not in database: ${event.data.email_id}`);
    return;
  }

  await updateScheduledEmailStatus(scheduledEmail.id, 'suppressed', {
    suppressionReason: 'complained',
  });

  console.log(`[Webhook] Updated email ${scheduledEmail.id} status to 'suppressed' (complained)`);
};

/**
 * Process Resend webhook event
 * 
 * This is the main handler that:
 * 1. Checks idempotency (prevents duplicate processing)
 * 2. Finds scheduled email by resend_email_id
 * 3. Logs event to email_events table
 * 4. Updates scheduled_emails status based on event type
 * 5. Handles emails not yet in database gracefully
 * 
 * @param event Verified webhook event
 * @returns Success status
 */
export const handleResendWebhook = async (
  event: ResendWebhookEvent
): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if event already processed (idempotency)
    const alreadyProcessed = await isEventAlreadyProcessed(
      event.data.email_id,
      event.type,
      event.created_at
    );

    if (alreadyProcessed) {
      console.log(`[Webhook] Event already processed (idempotency): ${event.type} for ${event.data.email_id}`);
      return {
        success: true,
        message: 'Event already processed',
      };
    }

    // Find scheduled email by Resend email ID
    const scheduledEmail = await findScheduledEmailByResendId(event.data.email_id);

    // Log event to email_events table (idempotent via unique constraint)
    await logWebhookEvent(event, scheduledEmail?.id || null);

    // Process event based on type
    switch (event.type) {
      case 'email.sent':
        await handleSentEvent(event, scheduledEmail);
        break;

      case 'email.delivered':
        await handleDeliveredEvent(event, scheduledEmail);
        break;

      case 'email.opened':
        await handleOpenedEvent(event, scheduledEmail);
        break;

      case 'email.clicked':
        await handleClickedEvent(event, scheduledEmail);
        break;

      case 'email.bounced':
        await handleBouncedEvent(event, scheduledEmail);
        break;

      case 'email.complained':
        await handleComplainedEvent(event, scheduledEmail);
        break;

      case 'email.scheduled':
        // 'email.scheduled' events are informational - we already track scheduling
        // in scheduled_emails.status, so we just log and skip
        console.log(`[Webhook] Received scheduled confirmation for email ${event.data.email_id}`);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return {
      success: true,
      message: 'Event processed successfully',
    };
  } catch (error) {
    console.error('[Webhook] Error processing webhook event:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to process webhook event: ${errorMessage}`);
  }
};

