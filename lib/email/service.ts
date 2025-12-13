import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { scheduleEmail as resendScheduleEmail, cancelEmail as resendCancelEmail, calculateScheduledAt } from './resend-client';
import { getTemplate, renderTemplate } from './templates';
import { getFlowById, getFlowSteps, generateFlowTriggerId } from './flows';
import { checkCanSendEmail, generateUnsubscribeToken } from './preferences';

/**
 * Email Service for Email System
 * 
 * Handles email scheduling, cancellation, and retrieval.
 * Includes idempotency checking and database transaction support.
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

/**
 * Scheduled email record
 */
export interface ScheduledEmail {
  id: string;
  user_id: string | null;
  email_address: string;
  flow_id: string | null;
  flow_step_id: string | null;
  template_id: string;
  template_version: number;
  template_snapshot: Record<string, any>;
  resend_email_id: string | null;
  resend_scheduled_id: string | null;
  status: 'pending' | 'scheduled' | 'sent' | 'cancelled' | 'failed' | 'suppressed';
  scheduled_at: string;
  sent_at: string | null;
  cancelled_at: string | null;
  suppression_reason: 'bounced' | 'complained' | 'unsubscribed' | null;
  is_test: boolean;
  flow_trigger_id: string | null;
  triggered_at: string | null;
  retry_count: number;
  last_retry_at: string | null;
  idempotency_key: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Schedule email parameters
 */
export interface ScheduleEmailParams {
  userId?: string;
  emailAddress: string;
  templateId: string;
  scheduledAt: string; // ISO 8601 timestamp
  idempotencyKey: string; // Required for idempotency
  variables?: Record<string, any>; // Template variables
  unsubscribeUrl?: string;
  isTest?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Schedule a single email
 * 
 * @param params Scheduling parameters
 * @returns Scheduled email record
 * @throws Error if scheduling fails or idempotency key already exists
 */
export const scheduleEmail = async (params: ScheduleEmailParams): Promise<ScheduledEmail> => {
  const supabase = getSupabaseAdmin();

  // Check for existing email with same idempotency key (idempotency check)
  const { data: existing, error: checkError } = await supabase
    .from('scheduled_emails')
    .select('*')
    .eq('idempotency_key', params.idempotencyKey)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "not found" which is expected
    throw new Error(`Failed to check idempotency: ${checkError.message}`);
  }

  // If exists, return existing record
  if (existing) {
    return existing as ScheduledEmail;
  }

  // Get template
  const template = await getTemplate(params.templateId);
  if (!template) {
    throw new Error(`Template ${params.templateId} not found`);
  }

  // Determine email type from template metadata or params
  const emailType = template.metadata?.email_type || params.metadata?.email_type || 'marketing';

  // Check preferences before scheduling marketing emails
  if (emailType === 'marketing' && params.userId) {
    const canSend = await checkCanSendEmail(
      params.userId,
      params.emailAddress,
      'marketing'
    );

    if (!canSend) {
      // User unsubscribed or email suppressed - return early with suppressed status
      const { data: suppressedEmail, error: insertError } = await supabase
        .from('scheduled_emails')
        .insert({
          user_id: params.userId,
          email_address: params.emailAddress,
          template_id: params.templateId,
          template_version: template.version,
          template_snapshot: {
            id: template.id,
            name: template.name,
            subject: template.subject,
            html_content: template.html_content,
            text_content: template.text_content,
            version: template.version,
            metadata: template.metadata,
          },
          resend_email_id: null,
          resend_scheduled_id: null,
          status: 'suppressed',
          scheduled_at: params.scheduledAt,
          is_test: params.isTest || false,
          idempotency_key: params.idempotencyKey,
          metadata: {
            ...(params.metadata || {}),
            email_type: emailType,
            suppression_reason: 'user_preferences',
          },
        })
        .select()
        .single();

      if (insertError && insertError.code !== '23505') {
        throw new Error(`Failed to record suppressed email: ${insertError.message}`);
      }

      // If insert failed due to duplicate idempotency key, fetch existing
      if (insertError?.code === '23505') {
        const { data: existingEmail } = await supabase
          .from('scheduled_emails')
          .select('*')
          .eq('idempotency_key', params.idempotencyKey)
          .single();

        if (existingEmail) {
          return existingEmail as ScheduledEmail;
        }
      }

      return suppressedEmail as ScheduledEmail;
    }
  }

  // Generate unsubscribe URL for marketing emails
  let unsubscribeUrl = params.unsubscribeUrl;
  if (emailType === 'marketing' && !unsubscribeUrl && params.userId) {
    try {
      const token = await generateUnsubscribeToken(params.userId, params.emailAddress);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://productcareerlyst.com';
      unsubscribeUrl = `${baseUrl}/unsubscribe/${token}`;
    } catch (error) {
      console.error('Failed to generate unsubscribe token:', error);
      // Continue without unsubscribe URL (should not happen, but don't block email)
    }
  }

  // Render template
  const html = await renderTemplate(
    template,
    params.variables || {},
    unsubscribeUrl
  );

  // Store template snapshot for version locking
  const templateSnapshot = {
    id: template.id,
    name: template.name,
    subject: template.subject,
    html_content: template.html_content,
    text_content: template.text_content,
    version: template.version,
    metadata: template.metadata,
  };

  // Schedule email via Resend
  let resendEmailId: string | null = null;
  let resendScheduledId: string | null = null;
  let status: 'pending' | 'scheduled' = 'pending';

  try {
    const resendResponse = await resendScheduleEmail({
      to: params.emailAddress,
      subject: template.subject,
      html,
      scheduledAt: params.scheduledAt,
    });

    resendEmailId = resendResponse.id;
    resendScheduledId = resendResponse.scheduledId || resendResponse.id;
    status = 'scheduled';
  } catch (error) {
    // If Resend fails, still store in database with 'pending' status
    // This allows retry logic to pick it up later
    console.error('Failed to schedule email via Resend:', error);
    status = 'pending';
  }

  // Insert into database (use transaction for atomicity)
  const { data: scheduledEmail, error: insertError } = await supabase
    .from('scheduled_emails')
    .insert({
      user_id: params.userId || null,
      email_address: params.emailAddress,
      template_id: params.templateId,
      template_version: template.version,
      template_snapshot: templateSnapshot,
      resend_email_id: resendEmailId,
      resend_scheduled_id: resendScheduledId,
      status,
      scheduled_at: params.scheduledAt,
      is_test: params.isTest || false,
      idempotency_key: params.idempotencyKey,
      metadata: {
        ...(params.metadata || {}),
        email_type: emailType,
      },
    })
    .select()
    .single();

  if (insertError) {
    // If insert fails due to unique constraint (idempotency key), fetch existing
    if (insertError.code === '23505') {
      const { data: existingEmail } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('idempotency_key', params.idempotencyKey)
        .single();

      if (existingEmail) {
        return existingEmail as ScheduledEmail;
      }
    }
    throw new Error(`Failed to schedule email: ${insertError.message}`);
  }

  return scheduledEmail as ScheduledEmail;
};

/**
 * Cancel a scheduled email
 * 
 * @param scheduledEmailId UUID of scheduled email
 * @returns Updated scheduled email record
 * @throws Error if cancellation fails
 */
export const cancelEmail = async (scheduledEmailId: string): Promise<ScheduledEmail> => {
  const supabase = getSupabaseAdmin();

  // Get scheduled email
  const { data: scheduledEmail, error: fetchError } = await supabase
    .from('scheduled_emails')
    .select('*')
    .eq('id', scheduledEmailId)
    .single();

  if (fetchError || !scheduledEmail) {
    throw new Error(`Scheduled email ${scheduledEmailId} not found`);
  }

  // Only cancel if status is pending or scheduled
  if (scheduledEmail.status !== 'pending' && scheduledEmail.status !== 'scheduled') {
    throw new Error(`Cannot cancel email with status: ${scheduledEmail.status}`);
  }

  // Cancel via Resend if resend_email_id exists
  if (scheduledEmail.resend_email_id) {
    try {
      await resendCancelEmail(scheduledEmail.resend_email_id);
    } catch (error) {
      // If Resend cancellation fails (email may already be sent), log but continue
      console.error('Failed to cancel email via Resend:', error);
    }
  }

  // Update status in database
  const { data: updatedEmail, error: updateError } = await supabase
    .from('scheduled_emails')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', scheduledEmailId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to cancel email: ${updateError.message}`);
  }

  return updatedEmail as ScheduledEmail;
};

/**
 * Get all scheduled emails for a user
 * 
 * @param userId User UUID
 * @param includeCancelled Include cancelled emails (default: false)
 * @returns Array of scheduled email records
 */
export const getScheduledEmailsForUser = async (
  userId: string,
  includeCancelled: boolean = false
): Promise<ScheduledEmail[]> => {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('scheduled_emails')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: true });

  if (!includeCancelled) {
    query = query.neq('status', 'cancelled');
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get scheduled emails: ${error.message}`);
  }

  return (data || []) as ScheduledEmail[];
};

/**
 * Get scheduled email by ID
 * 
 * @param scheduledEmailId UUID of scheduled email
 * @returns Scheduled email record or null
 */
export const getScheduledEmailById = async (scheduledEmailId: string): Promise<ScheduledEmail | null> => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('scheduled_emails')
    .select('*')
    .eq('id', scheduledEmailId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get scheduled email: ${error.message}`);
  }

  return data as ScheduledEmail | null;
};

/**
 * Get all scheduled emails (admin function)
 * 
 * @param filters Optional filters
 * @returns Array of scheduled email records
 */
export const getAllScheduledEmails = async (filters?: {
  userId?: string;
  status?: string;
  isTest?: boolean;
  emailAddress?: string;
  limit?: number;
}): Promise<ScheduledEmail[]> => {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('scheduled_emails')
    .select('*')
    .order('scheduled_at', { ascending: false });

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.isTest !== undefined) {
    query = query.eq('is_test', filters.isTest);
  }

  if (filters?.emailAddress) {
    query = query.ilike('email_address', `%${filters.emailAddress}%`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get scheduled emails: ${error.message}`);
  }

  return (data || []) as ScheduledEmail[];
};

/**
 * Schedule email sequence parameters
 */
export interface ScheduleSequenceParams {
  userId?: string;
  emailAddress: string;
  flowId: string;
  idempotencyKeyPrefix: string; // Prefix for generating unique idempotency keys
  variables?: Record<string, any>; // Template variables
  isTest?: boolean;
  testModeMultiplier?: number; // For test mode: 1 minute = 1 day (default: 1)
  triggerEventId?: string; // Optional trigger event ID for flow_trigger_id
  metadata?: Record<string, any>;
}

/**
 * Schedule an entire email sequence (flow)
 * 
 * Uses database transaction for atomicity.
 * Prevents duplicate flow triggers using flow_trigger_id.
 * 
 * @param params Sequence scheduling parameters
 * @returns Array of scheduled email records
 * @throws Error if scheduling fails
 */
export const scheduleSequence = async (
  params: ScheduleSequenceParams
): Promise<ScheduledEmail[]> => {
  const startTime = Date.now();
  console.log('[scheduleSequence] Starting', {
    userId: params.userId,
    flowId: params.flowId,
    emailAddress: params.emailAddress,
    triggerEventId: params.triggerEventId,
  });

  try {
    const supabase = getSupabaseAdmin();

    // Early check: If user is unsubscribed from marketing emails, skip the entire sequence
    // This avoids unnecessary work (fetching flow, steps, templates) when we know emails won't be sent
    if (params.userId) {
      const canSendMarketing = await checkCanSendEmail(
        params.userId,
        params.emailAddress,
        'marketing'
      );

      if (!canSendMarketing) {
        const duration = Date.now() - startTime;
        console.log('[scheduleSequence] Skipping sequence - user unsubscribed or email suppressed', {
          userId: params.userId,
          flowId: params.flowId,
          emailAddress: params.emailAddress,
          durationMs: duration,
        });
        return []; // Return empty array - this is expected behavior, not an error
      }
    }

    // Get flow and steps
    const flow = await getFlowById(params.flowId);
    if (!flow) {
      throw new Error(`Flow ${params.flowId} not found`);
    }

    const steps = await getFlowSteps(params.flowId);
    if (steps.length === 0) {
      throw new Error(`Flow ${params.flowId} has no steps`);
    }

  // Generate flow trigger ID to prevent duplicates
  const flowTriggerId = generateFlowTriggerId(
    params.userId || 'anonymous',
    params.flowId,
    params.triggerEventId
  );

  console.log('[scheduleSequence] Checking for existing flow trigger', {
    flowTriggerId,
    userId: params.userId,
    flowId: params.flowId,
    triggerEventId: params.triggerEventId,
  });

  // Check if this flow has already been triggered for this user/flow/event combination
  const { data: existingTrigger, error: checkError } = await supabase
    .from('scheduled_emails')
    .select('id')
    .eq('flow_trigger_id', flowTriggerId)
    .limit(1)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('[scheduleSequence] Error checking for existing trigger', {
      flowTriggerId,
      error: checkError,
    });
    throw new Error(`Failed to check for existing flow trigger: ${checkError.message}`);
  }

  if (existingTrigger) {
    // Flow already triggered - return existing scheduled emails for this trigger
    console.log('[scheduleSequence] Existing flow trigger found, fetching existing emails', {
      flowTriggerId,
      existingTriggerId: existingTrigger.id,
    });
    
    const { data: existingEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('flow_trigger_id', flowTriggerId)
      .order('scheduled_at', { ascending: true });

    if (fetchError) {
      console.error('[scheduleSequence] Error fetching existing emails', {
        flowTriggerId,
        error: fetchError,
      });
      throw new Error(`Failed to fetch existing scheduled emails: ${fetchError.message}`);
    }

    console.log('[scheduleSequence] Returning existing scheduled emails', {
      flowTriggerId,
      emailCount: existingEmails?.length || 0,
      emailIds: existingEmails?.map(e => e.id) || [],
    });

    return (existingEmails || []) as ScheduledEmail[];
  }

  console.log('[scheduleSequence] No existing trigger found, scheduling new emails', {
    flowTriggerId,
    userId: params.userId,
    flowId: params.flowId,
    stepCount: steps.length,
  });

  // Calculate test mode multiplier (default: 1, meaning no multiplier for production)
  // In test mode: 1 minute = 1 day, so multiplier should be 1/1440 to convert production minutes
  // In production: 1440 minutes = 1 day, so we use actual minutes (multiplier = 1)
  const testMultiplier = params.testModeMultiplier || 1;
  const isTest = params.isTest || false;

  // Calculate base trigger time
  const triggeredAt = new Date();
  const baseDate = triggeredAt;

  // Schedule all steps in a transaction
  const scheduledEmails: ScheduledEmail[] = [];

  // Use a transaction by scheduling all emails, then inserting all at once
  // (Supabase doesn't support explicit transactions, so we'll use a single insert with multiple rows)
  const emailsToInsert: any[] = [];

  // Prepare all emails for database insertion (without Resend calls)
  // We'll insert to DB first, then process Resend calls in background
  const emailProcessingData: Array<{
    step: typeof steps[0];
    template: any;
    scheduledAt: string; // ISO 8601 timestamp string
    html: string;
    subject: string;
  }> = [];

  console.log('[scheduleSequence] Processing steps', { stepCount: steps.length });
  
  for (const step of steps) {
    try {
      console.log('[scheduleSequence] Processing step', {
        stepOrder: step.step_order,
        stepId: step.id,
        templateId: step.template_id,
        timeOffsetMinutes: step.time_offset_minutes,
      });
    // Calculate time offset (apply test multiplier if in test mode)
    // In test mode: multiply by 1/1440 to convert production minutes (1440 = 1 day) to test minutes (1 = 1 day)
    // In production: use actual minutes as-is (1440 = 1 day)
    let timeOffsetMinutes = isTest 
      ? step.time_offset_minutes * testMultiplier
      : step.time_offset_minutes;

    // For immediate emails (0 minutes), ensure they're scheduled at least 10 seconds in the future
    // This prevents "scheduledAt must be in the future" errors due to timing
    if (timeOffsetMinutes === 0) {
      timeOffsetMinutes = 0.17; // ~10 seconds in minutes
    }

    // Calculate scheduled time
    const scheduledAt = calculateScheduledAt(baseDate, timeOffsetMinutes);

    // Get template
    const template = await getTemplate(step.template_id);
    if (!template) {
      throw new Error(`Template ${step.template_id} not found for step ${step.step_order}`);
    }

    // Use step's locked template version
    const templateVersion = step.template_version;

    // Determine email type from step
    const emailType = step.email_type || template.metadata?.email_type || 'marketing';

    // Check preferences before scheduling marketing emails
    if (emailType === 'marketing' && params.userId) {
      const canSend = await checkCanSendEmail(
        params.userId,
        params.emailAddress,
        'marketing'
      );

      if (!canSend) {
        // User unsubscribed or email suppressed - skip this step
        console.log(`[scheduleSequence] Skipping step ${step.step_order} - user unsubscribed or email suppressed`);
        continue;
      }
    }

    // Generate unsubscribe URL for marketing emails
    let unsubscribeUrl = params.variables?.unsubscribeUrl;
    if (emailType === 'marketing' && !unsubscribeUrl && params.userId) {
      try {
        const token = await generateUnsubscribeToken(params.userId, params.emailAddress);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://productcareerlyst.com';
        unsubscribeUrl = `${baseUrl}/unsubscribe/${token}`;
      } catch (error) {
        console.error(`[scheduleSequence] Failed to generate unsubscribe token for step ${step.step_order}:`, error);
        // Continue without unsubscribe URL (should not happen, but don't block email)
      }
    }

    // Render template with step order and flow name
    const html = await renderTemplate(
      template,
      {
        ...(params.variables || {}),
        stepOrder: step.step_order,
        flowName: flow.name,
        firstName: params.variables?.firstName || null,
        unsubscribeUrl,
      },
      unsubscribeUrl
    );

    // Store template snapshot for version locking
    const templateSnapshot = {
      id: template.id,
      name: template.name,
      subject: step.subject_override || template.subject,
      html_content: template.html_content,
      text_content: template.text_content,
      version: templateVersion,
      metadata: template.metadata,
    };

    // Generate unique idempotency key for this step
    const idempotencyKey = `${params.idempotencyKeyPrefix}_step_${step.step_order}_${Date.now()}`;

    // Prepare email record for batch insert (all start as 'pending')
    const emailRecord = {
      user_id: params.userId || null,
      email_address: params.emailAddress,
      flow_id: params.flowId,
      flow_step_id: step.id,
      template_id: step.template_id,
      template_version: templateVersion,
      template_snapshot: templateSnapshot,
      resend_email_id: null,
      resend_scheduled_id: null,
      status: 'pending' as const,
      scheduled_at: scheduledAt,
      is_test: isTest,
      flow_trigger_id: flowTriggerId,
      triggered_at: triggeredAt.toISOString(),
      idempotency_key: idempotencyKey,
      metadata: {
        ...(params.metadata || {}),
        step_order: step.step_order,
        time_offset_minutes: step.time_offset_minutes,
        email_type: step.email_type,
      },
    };

      emailsToInsert.push(emailRecord);
      
      // Store data needed for background Resend processing
      emailProcessingData.push({
        step,
        template,
        scheduledAt,
        html,
        subject: step.subject_override || template.subject,
      });
      
      console.log('[scheduleSequence] Successfully processed step', {
        stepOrder: step.step_order,
        scheduledAt,
      });
    } catch (stepError) {
      console.error('[scheduleSequence] Error processing step', {
        stepOrder: step.step_order,
        stepId: step.id,
        templateId: step.template_id,
        error: stepError,
        errorMessage: stepError instanceof Error ? stepError.message : String(stepError),
        errorStack: stepError instanceof Error ? stepError.stack : undefined,
      });
      // Continue with other steps - don't fail entire sequence if one step fails
      // But log the error so we know what happened
    }
  }
  
  console.log('[scheduleSequence] Finished processing all steps', {
    emailsToInsertCount: emailsToInsert.length,
    emailProcessingDataCount: emailProcessingData.length,
    stepCount: steps.length,
  });

  // Insert all emails in a single batch (atomic operation)
  // Only insert if we have emails to insert
  if (emailsToInsert.length === 0) {
    throw new Error('No emails to schedule - all steps failed to process (check logs for template or rendering errors)');
  }

  console.log(`[scheduleSequence] Inserting ${emailsToInsert.length} emails into database`);
  console.log(`[scheduleSequence] Flow trigger ID: ${flowTriggerId}`);
  console.log(`[scheduleSequence] First email sample:`, {
    email_address: emailsToInsert[0].email_address,
    flow_id: emailsToInsert[0].flow_id,
    status: emailsToInsert[0].status,
    scheduled_at: emailsToInsert[0].scheduled_at,
  });

  const { data: insertedEmails, error: insertError } = await supabase
    .from('scheduled_emails')
    .insert(emailsToInsert)
    .select();

  if (insertError) {
    console.error(`[scheduleSequence] Insert error:`, insertError);
    console.error(`[scheduleSequence] Error code:`, insertError.code);
    console.error(`[scheduleSequence] Error message:`, insertError.message);
    console.error(`[scheduleSequence] Error details:`, insertError.details);
    
    // If insert fails due to unique constraint on idempotency_key, try to fetch existing
    if (insertError.code === '23505') {
      console.log(`[scheduleSequence] Duplicate idempotency key detected, fetching existing emails`);
      console.log(`[scheduleSequence] Flow ID: ${params.flowId}, Flow Trigger ID: ${flowTriggerId}`);
      
      // Fetch existing emails by flow_trigger_id (all emails in this flow instance)
      const { data: existingEmails, error: fetchError } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('flow_trigger_id', flowTriggerId)
        .order('scheduled_at', { ascending: true });

      if (fetchError) {
        console.error(`[scheduleSequence] Failed to fetch existing emails:`, fetchError);
        throw new Error(`Failed to fetch existing scheduled emails: ${fetchError.message}`);
      }

      console.log(`[scheduleSequence] Found ${existingEmails?.length || 0} existing emails`);
      
      if (existingEmails && existingEmails.length > 0) {
        return existingEmails as ScheduledEmail[];
      }
      
      // If no existing emails found but constraint violation occurred, it's likely an idempotency_key conflict
      console.error(`[scheduleSequence] WARNING: Constraint violation but no existing emails found!`);
      throw new Error(`Duplicate idempotency key detected but no existing emails found. This may indicate a race condition.`);
    }

    throw new Error(`Failed to schedule sequence: ${insertError.message}`);
  }

  if (!insertedEmails || insertedEmails.length === 0) {
    console.error(`[scheduleSequence] WARNING: Insert succeeded but returned no emails!`);
    console.error(`[scheduleSequence] Attempted to insert ${emailsToInsert.length} emails`);
    // Try to fetch what was actually inserted
    const { data: fetchedEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('flow_trigger_id', flowTriggerId)
      .order('scheduled_at', { ascending: true });
    
    if (fetchError) {
      console.error(`[scheduleSequence] Failed to fetch inserted emails:`, fetchError);
      throw new Error(`Insert succeeded but returned no data and fetch failed: ${fetchError.message}`);
    }
    
    console.log(`[scheduleSequence] Fetched ${fetchedEmails?.length || 0} emails from database`);
    return (fetchedEmails || []) as ScheduledEmail[];
  }

  console.log('[scheduleSequence] Successfully inserted emails', {
    flowTriggerId,
    emailCount: insertedEmails.length,
    emailIds: insertedEmails.map(e => e.id),
    userId: params.userId,
    flowId: params.flowId,
  });
  
    // Process Resend scheduling in background (fire-and-forget)
    // This allows the API to return immediately while Resend calls happen asynchronously
    processResendSchedulingAsync(insertedEmails, emailProcessingData, params.emailAddress).catch((error) => {
      console.error('[scheduleSequence] Error in background Resend processing:', error);
    });
    
    const duration = Date.now() - startTime;
    console.log('[scheduleSequence] Completed successfully', {
      userId: params.userId,
      flowId: params.flowId,
      emailCount: insertedEmails.length,
      durationMs: duration,
    });
    
    return insertedEmails as ScheduledEmail[];
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[scheduleSequence] FATAL ERROR - Failed to schedule sequence', {
      userId: params.userId,
      flowId: params.flowId,
      emailAddress: params.emailAddress,
      triggerEventId: params.triggerEventId,
      durationMs: duration,
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

/**
 * Process Resend scheduling calls in the background with rate limiting
 * Updates database records as Resend calls complete
 */
async function processResendSchedulingAsync(
  insertedEmails: ScheduledEmail[],
  emailProcessingData: Array<{
    step: any;
    template: any;
    scheduledAt: string; // ISO 8601 timestamp string
    html: string;
    subject: string;
  }>,
  emailAddress: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const RATE_LIMIT_DELAY_MS = 600; // 600ms = ~1.67 requests/second (safe margin)
  
  console.log(`[processResendSchedulingAsync] Starting background processing for ${insertedEmails.length} emails`);
  
  // Create a map of step_order to processing data for easy lookup
  const processingDataMap = new Map(
    emailProcessingData.map((data, index) => [data.step.step_order, { ...data, index }])
  );
  
  // Sort inserted emails by step_order to process in order
  const sortedEmails = [...insertedEmails].sort((a, b) => {
    const aOrder = a.metadata?.step_order || 0;
    const bOrder = b.metadata?.step_order || 0;
    return aOrder - bOrder;
  });
  
  for (let i = 0; i < sortedEmails.length; i++) {
    const email = sortedEmails[i];
    const stepOrder = email.metadata?.step_order;
    
    if (!stepOrder) {
      console.error(`[processResendSchedulingAsync] Email ${email.id} has no step_order in metadata`);
      continue;
    }
    
    const processingDataEntry = processingDataMap.get(stepOrder);
    if (!processingDataEntry) {
      console.error(`[processResendSchedulingAsync] No processing data for step_order ${stepOrder}`);
      continue;
    }
    
    const processingData = processingDataEntry;
    
    // Add delay between requests (except for the first one)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }
    
    try {
      // Schedule email via Resend
      const resendResponse = await resendScheduleEmail({
        to: emailAddress,
        subject: processingData.subject,
        html: processingData.html,
        scheduledAt: processingData.scheduledAt,
      });

      const resendEmailId = resendResponse.id;
      const resendScheduledId = resendResponse.scheduledId || resendResponse.id;
      
      // Update database record with Resend IDs and status
      const { error: updateError } = await supabase
        .from('scheduled_emails')
        .update({
          resend_email_id: resendEmailId,
          resend_scheduled_id: resendScheduledId,
          status: 'scheduled',
        })
        .eq('id', email.id);

      if (updateError) {
        console.error(`[processResendSchedulingAsync] Failed to update email ${email.id} after Resend scheduling:`, updateError);
      } else {
        console.log(`[processResendSchedulingAsync] Successfully scheduled email ${email.id} via Resend (${resendEmailId})`);
      }
    } catch (error) {
      // If Resend fails, update database with error info but keep as 'pending'
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[processResendSchedulingAsync] Failed to schedule email ${email.id} via Resend:`, errorMessage);
      
      const { error: updateError } = await supabase
        .from('scheduled_emails')
        .update({
          metadata: {
            ...(email.metadata || {}),
            resend_schedule_error: errorMessage,
            resend_schedule_attempted_at: new Date().toISOString(),
          },
        })
        .eq('id', email.id);

      if (updateError) {
        console.error(`[processResendSchedulingAsync] Failed to update error metadata for email ${email.id}:`, updateError);
      }
    }
  }
  
  console.log(`[processResendSchedulingAsync] Completed background processing for ${insertedEmails.length} emails`);
}

/**
 * Process Resend scheduling for emails that are already in the database
 * This is used by Inngest to ensure Resend scheduling completes in a durable context
 *
 * @param pendingEmails Array of scheduled email records that need Resend scheduling
 * @param emailAddress Email address to send to
 */
export async function processResendSchedulingForEmails(
  pendingEmails: ScheduledEmail[],
  emailAddress: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const RATE_LIMIT_DELAY_MS = 600; // 600ms = ~1.67 requests/second (safe margin)

  console.log(`[processResendSchedulingForEmails] Starting processing for ${pendingEmails.length} emails`);

  // Sort by step_order to process in order
  const sortedEmails = [...pendingEmails].sort((a, b) => {
    const aOrder = a.metadata?.step_order || 0;
    const bOrder = b.metadata?.step_order || 0;
    return aOrder - bOrder;
  });

  for (let i = 0; i < sortedEmails.length; i++) {
    const email = sortedEmails[i];

    // Add delay between requests (except for the first one)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }

    try {
      // Re-render the template using the snapshot
      const templateSnapshot = email.template_snapshot as any;
      if (!templateSnapshot) {
        console.error(`[processResendSchedulingForEmails] Email ${email.id} has no template_snapshot`);
        continue;
      }

      // Get fresh template to re-render (or use snapshot HTML if available)
      let html: string;
      const subject = templateSnapshot.subject || 'No subject';

      if (templateSnapshot.html_content) {
        // Use pre-rendered HTML from snapshot
        html = templateSnapshot.html_content;
      } else {
        // Re-render the template
        const template = await getTemplate(email.template_id);
        if (!template) {
          console.error(`[processResendSchedulingForEmails] Template ${email.template_id} not found for email ${email.id}`);
          continue;
        }

        // Generate unsubscribe URL if needed
        let unsubscribeUrl: string | undefined;
        const emailType = email.metadata?.email_type || templateSnapshot.metadata?.email_type || 'marketing';
        if (emailType === 'marketing' && email.user_id) {
          try {
            const token = await generateUnsubscribeToken(email.user_id, emailAddress);
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://productcareerlyst.com';
            unsubscribeUrl = `${baseUrl}/unsubscribe/${token}`;
          } catch (error) {
            console.error(`[processResendSchedulingForEmails] Failed to generate unsubscribe token:`, error);
          }
        }

        // Render template
        html = await renderTemplate(
          template,
          {
            stepOrder: email.metadata?.step_order,
            firstName: null, // Email components handle fallback with "Hey there,"
            unsubscribeUrl,
          },
          unsubscribeUrl
        );
      }

      // Schedule email via Resend
      const resendResponse = await resendScheduleEmail({
        to: emailAddress,
        subject,
        html,
        scheduledAt: email.scheduled_at,
      });

      const resendEmailId = resendResponse.id;
      const resendScheduledId = resendResponse.scheduledId || resendResponse.id;

      // Update database record with Resend IDs and status
      const { error: updateError } = await supabase
        .from('scheduled_emails')
        .update({
          resend_email_id: resendEmailId,
          resend_scheduled_id: resendScheduledId,
          status: 'scheduled',
        })
        .eq('id', email.id);

      if (updateError) {
        console.error(`[processResendSchedulingForEmails] Failed to update email ${email.id}:`, updateError);
      } else {
        console.log(`[processResendSchedulingForEmails] Successfully scheduled email ${email.id} via Resend (${resendEmailId})`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[processResendSchedulingForEmails] Failed to schedule email ${email.id}:`, errorMessage);

      // Update metadata with error
      const { error: updateError } = await supabase
        .from('scheduled_emails')
        .update({
          metadata: {
            ...(email.metadata || {}),
            resend_schedule_error: errorMessage,
            resend_schedule_attempted_at: new Date().toISOString(),
          },
        })
        .eq('id', email.id);

      if (updateError) {
        console.error(`[processResendSchedulingForEmails] Failed to update error metadata for email ${email.id}:`, updateError);
      }
    }
  }

  console.log(`[processResendSchedulingForEmails] Completed processing for ${pendingEmails.length} emails`);
}

/**
 * Cancel all remaining emails in a sequence
 *
 * Can cancel by:
 * - flowTriggerId (recommended for testing - works without userId)
 * - userId + flowId (for user-specific flows)
 * 
 * @param flowTriggerId Flow trigger ID (if provided, cancels this specific instance)
 * @param userId User UUID (optional, required if flowTriggerId not provided)
 * @param flowId Flow UUID (optional, required if flowTriggerId not provided)
 * @returns Number of emails cancelled
 */
export const cancelSequence = async (
  flowTriggerId?: string,
  userId?: string,
  flowId?: string
): Promise<number> => {
  const supabase = getSupabaseAdmin();

  // Build query - prefer flowTriggerId if provided
  let query = supabase
    .from('scheduled_emails')
    .select('*')
    .in('status', ['pending', 'scheduled']);

  if (flowTriggerId) {
    // Cancel by flow trigger ID (works for test flows without userId)
    query = query.eq('flow_trigger_id', flowTriggerId);
  } else if (userId && flowId) {
    // Cancel by user + flow (for user-specific flows)
    query = query.eq('user_id', userId).eq('flow_id', flowId);
  } else {
    throw new Error('Either flowTriggerId or both userId and flowId must be provided');
  }

  const { data: scheduledEmails, error: fetchError } = await query;

  if (fetchError) {
    throw new Error(`Failed to fetch scheduled emails: ${fetchError.message}`);
  }

  if (!scheduledEmails || scheduledEmails.length === 0) {
    return 0;
  }

  // Update status in database first (fast, immediate)
  const emailIds = scheduledEmails.map((e) => e.id);
  const { error: updateError } = await supabase
    .from('scheduled_emails')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .in('id', emailIds);

  if (updateError) {
    throw new Error(`Failed to cancel sequence: ${updateError.message}`);
  }

  console.log(`[cancelSequence] Marked ${scheduledEmails.length} emails as cancelled in database`);

  // Process Resend cancellations in background (fire-and-forget)
  // This allows the API to return immediately while Resend calls happen asynchronously
  processResendCancellationAsync(scheduledEmails).catch((error) => {
    console.error('[cancelSequence] Error in background Resend cancellation processing:', error);
  });

  return scheduledEmails.length;
};

/**
 * Process Resend cancellation calls in the background with rate limiting
 * Updates database records if Resend cancellation succeeds
 */
async function processResendCancellationAsync(
  scheduledEmails: ScheduledEmail[]
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const RATE_LIMIT_DELAY_MS = 600; // 600ms = ~1.67 requests/second (safe margin)
  
  console.log(`[processResendCancellationAsync] Starting background cancellation for ${scheduledEmails.length} emails`);
  
  for (let i = 0; i < scheduledEmails.length; i++) {
    const email = scheduledEmails[i];
    
    // Add delay between requests (except for the first one)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }
    
    // Prefer resend_scheduled_id for scheduled emails, fall back to resend_email_id
    const resendIdToCancel = email.resend_scheduled_id || email.resend_email_id;
    
    if (resendIdToCancel) {
      try {
        await resendCancelEmail(resendIdToCancel);
        console.log(`[processResendCancellationAsync] Successfully cancelled email ${resendIdToCancel} via Resend`);
        // Note: Database is already updated, so we don't need to update again
      } catch (error) {
        // If Resend cancellation fails (email may already be sent, rate limited, etc.), log but continue
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[processResendCancellationAsync] Failed to cancel email via Resend: ${resendIdToCancel}`, errorMessage);
        
        // Update metadata with cancellation error (email is already marked as cancelled in DB)
        const { error: updateError } = await supabase
          .from('scheduled_emails')
          .update({
            metadata: {
              ...(email.metadata || {}),
              resend_cancel_error: errorMessage,
              resend_cancel_attempted_at: new Date().toISOString(),
            },
          })
          .eq('id', email.id);

        if (updateError) {
          console.error(`[processResendCancellationAsync] Failed to update error metadata for email ${email.id}:`, updateError);
        }
      }
    } else {
      console.log(`[processResendCancellationAsync] Email ${email.id} has no Resend ID, skipping Resend cancellation (already marked as cancelled in DB)`);
    }
  }
  
  console.log(`[processResendCancellationAsync] Completed background cancellation processing for ${scheduledEmails.length} emails`);
}

/**
 * Process Resend cancellation for emails that are already marked as cancelled in the database
 * This is used by Inngest to ensure Resend cancellation calls complete in a durable context
 *
 * @param cancelledEmails Array of scheduled email records that need Resend cancellation
 */
export async function processResendCancellationForEmails(
  cancelledEmails: ScheduledEmail[]
): Promise<{ cancelled: number; failed: number }> {
  const supabase = getSupabaseAdmin();
  const RATE_LIMIT_DELAY_MS = 600; // 600ms = ~1.67 requests/second (safe margin)

  console.log(`[processResendCancellationForEmails] Starting processing for ${cancelledEmails.length} emails`);

  let cancelledCount = 0;
  let failedCount = 0;

  for (let i = 0; i < cancelledEmails.length; i++) {
    const email = cancelledEmails[i];

    // Add delay between requests (except for the first one)
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }

    // Prefer resend_scheduled_id for scheduled emails, fall back to resend_email_id
    const resendIdToCancel = email.resend_scheduled_id || email.resend_email_id;

    if (!resendIdToCancel) {
      console.log(`[processResendCancellationForEmails] Email ${email.id} has no Resend ID, skipping`);
      continue;
    }

    try {
      await resendCancelEmail(resendIdToCancel);
      console.log(`[processResendCancellationForEmails] Successfully cancelled email ${email.id} via Resend (${resendIdToCancel})`);
      cancelledCount++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[processResendCancellationForEmails] Failed to cancel email ${email.id} via Resend:`, errorMessage);
      failedCount++;

      // Update metadata with cancellation error
      const { error: updateError } = await supabase
        .from('scheduled_emails')
        .update({
          metadata: {
            ...(email.metadata || {}),
            resend_cancel_error: errorMessage,
            resend_cancel_attempted_at: new Date().toISOString(),
          },
        })
        .eq('id', email.id);

      if (updateError) {
        console.error(`[processResendCancellationForEmails] Failed to update error metadata for email ${email.id}:`, updateError);
      }
    }
  }

  console.log(`[processResendCancellationForEmails] Completed: ${cancelledCount} cancelled, ${failedCount} failed`);

  return { cancelled: cancelledCount, failed: failedCount };
}

/**
 * Cancel all scheduled emails for a user
 *
 * Cancels all pending/scheduled emails for a specific user (regardless of flow, template, or email type).
 * Updates database immediately and processes Resend cancellations in background with rate limiting.
 *
 * @param userId User UUID
 * @returns Number of emails cancelled
 */
export const cancelAllScheduledEmailsForUser = async (
  userId: string
): Promise<number> => {
  const supabase = getSupabaseAdmin();

  // Find all scheduled emails for this user (pending or scheduled status)
  const { data: scheduledEmails, error: fetchError } = await supabase
    .from('scheduled_emails')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'scheduled']);

  if (fetchError) {
    throw new Error(`Failed to fetch scheduled emails: ${fetchError.message}`);
  }

  if (!scheduledEmails || scheduledEmails.length === 0) {
    return 0;
  }

  // Update status in database first (fast, immediate)
  const emailIds = scheduledEmails.map((e) => e.id);
  const { error: updateError } = await supabase
    .from('scheduled_emails')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .in('id', emailIds);

  if (updateError) {
    throw new Error(`Failed to cancel scheduled emails: ${updateError.message}`);
  }

  console.log(`[cancelAllScheduledEmailsForUser] Marked ${scheduledEmails.length} emails as cancelled in database for user ${userId}`);

  // Process Resend cancellations in background (fire-and-forget)
  // This allows the API to return immediately while Resend calls happen asynchronously
  processResendCancellationAsync(scheduledEmails).catch((error) => {
    console.error('[cancelAllScheduledEmailsForUser] Error in background Resend cancellation processing:', error);
  });

  return scheduledEmails.length;
};

