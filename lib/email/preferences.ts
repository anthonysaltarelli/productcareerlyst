import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { cancelEmail as resendCancelEmail } from './resend-client';
import { addSubscriberToForm } from '@/lib/utils/convertkit';

/**
 * Email Preferences Service
 * 
 * Handles user email preferences, unsubscribe functionality, and ConvertKit sync.
 * Includes automatic cancellation of scheduled marketing emails on unsubscribe.
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
 * User email preferences record
 */
export interface UserEmailPreferences {
  id: string;
  user_id: string;
  email_address: string;
  marketing_emails_enabled: boolean;
  unsubscribed_at: string | null;
  unsubscribe_reason: string | null;
  email_topics: string[]; // e.g., ["trial_sequence", "product_updates", "newsletter"]
  convertkit_subscriber_id: string | null;
  convertkit_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get user's email preferences
 * 
 * @param userId User UUID
 * @param emailAddress Email address (optional, will fetch from auth if not provided)
 * @returns User email preferences or null if not found
 */
export const getUserEmailPreferences = async (
  userId: string,
  emailAddress?: string
): Promise<UserEmailPreferences | null> => {
  const supabase = getSupabaseAdmin();

  // If email not provided, try to get from auth.users
  let email = emailAddress;
  if (!email) {
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    if (authUser?.user?.email) {
      email = authUser.user.email;
    }
  }

  if (!email) {
    throw new Error('Email address is required');
  }

  const { data, error } = await supabase
    .from('user_email_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('email_address', email)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get email preferences: ${error.message}`);
  }

  // If preferences don't exist, create default preferences
  if (!data) {
    return await createDefaultPreferences(userId, email);
  }

  return data as UserEmailPreferences;
};

/**
 * Create default email preferences for a user
 * 
 * @param userId User UUID
 * @param emailAddress Email address
 * @returns Created preferences record
 */
const createDefaultPreferences = async (
  userId: string,
  emailAddress: string
): Promise<UserEmailPreferences> => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('user_email_preferences')
    .insert({
      user_id: userId,
      email_address: emailAddress,
      marketing_emails_enabled: true,
      email_topics: [],
    })
    .select()
    .single();

  if (error) {
    // If error is due to unique constraint, fetch existing
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('user_email_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('email_address', emailAddress)
        .single();

      if (existing) {
        return existing as UserEmailPreferences;
      }
    }
    throw new Error(`Failed to create email preferences: ${error.message}`);
  }

  return data as UserEmailPreferences;
};

/**
 * Check if email can be sent to user
 * 
 * Checks:
 * 1. User preferences (marketing_emails_enabled)
 * 2. Email suppressions table
 * 
 * @param userId User UUID
 * @param emailAddress Email address
 * @param emailType Email type ('transactional' or 'marketing')
 * @returns true if email can be sent, false if blocked
 */
export const checkCanSendEmail = async (
  userId: string,
  emailAddress: string,
  emailType: 'transactional' | 'marketing'
): Promise<boolean> => {
  // Transactional emails are always allowed (no unsubscribe checks)
  if (emailType === 'transactional') {
    // Still check suppressions (bounced/complained addresses)
    const supabase = getSupabaseAdmin();
    const { data: suppression } = await supabase
      .from('email_suppressions')
      .select('id')
      .eq('email_address', emailAddress)
      .maybeSingle();

    return !suppression; // Can send if not suppressed
  }

  // For marketing emails, check preferences and suppressions
  const supabase = getSupabaseAdmin();

  // Check suppressions first (fast check)
  const { data: suppression } = await supabase
    .from('email_suppressions')
    .select('id')
    .eq('email_address', emailAddress)
    .maybeSingle();

  if (suppression) {
    return false; // Email address is suppressed
  }

  // Check user preferences
  const preferences = await getUserEmailPreferences(userId, emailAddress);
  if (!preferences) {
    // If no preferences exist, default to allowing (will be created on first send)
    return true;
  }

  return preferences.marketing_emails_enabled;
};

/**
 * Cancel all scheduled marketing emails for a user
 * 
 * Queries scheduled_emails for user with email_type = 'marketing' and status IN ('pending', 'scheduled')
 * Cancels each email via Resend API and updates status to 'cancelled'
 * 
 * @param userId User UUID
 * @param emailAddress Email address
 * @returns Number of emails cancelled
 */
export const cancelScheduledMarketingEmails = async (
  userId: string,
  emailAddress: string
): Promise<number> => {
  const supabase = getSupabaseAdmin();

  // Find all scheduled marketing emails for this user
  const { data: scheduledEmails, error: fetchError } = await supabase
    .from('scheduled_emails')
    .select('*')
    .eq('user_id', userId)
    .eq('email_address', emailAddress)
    .in('status', ['pending', 'scheduled'])
    .eq('metadata->>email_type', 'marketing'); // Check metadata.email_type

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
      suppression_reason: 'unsubscribed',
    })
    .in('id', emailIds);

  if (updateError) {
    throw new Error(`Failed to cancel scheduled emails: ${updateError.message}`);
  }

  // Process Resend cancellations in background (fire-and-forget)
  processResendCancellationAsync(scheduledEmails).catch((error) => {
    console.error('[cancelScheduledMarketingEmails] Error in background Resend cancellation:', error);
  });

  return scheduledEmails.length;
};

/**
 * Process Resend cancellation calls in the background
 */
async function processResendCancellationAsync(
  scheduledEmails: any[]
): Promise<void> {
  const RATE_LIMIT_DELAY_MS = 600; // 600ms = ~1.67 requests/second

  for (let i = 0; i < scheduledEmails.length; i++) {
    const email = scheduledEmails[i];

    // Add delay between requests (except for the first one)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }

    const resendIdToCancel = email.resend_scheduled_id || email.resend_email_id;

    if (resendIdToCancel) {
      try {
        await resendCancelEmail(resendIdToCancel);
        console.log(`[cancelScheduledMarketingEmails] Successfully cancelled email ${resendIdToCancel} via Resend`);
      } catch (error) {
        // If Resend cancellation fails, log but continue (email already marked as cancelled in DB)
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[cancelScheduledMarketingEmails] Failed to cancel email via Resend: ${resendIdToCancel}`, errorMessage);
      }
    }
  }
}

/**
 * Unsubscribe user from marketing emails
 * 
 * - Sets marketing_emails_enabled = false
 * - Sets unsubscribed_at timestamp
 * - Cancels all scheduled marketing emails
 * - Syncs to ConvertKit if newsletter was enabled
 * 
 * @param userId User UUID
 * @param emailAddress Email address
 * @param reason Optional unsubscribe reason
 * @returns Updated preferences record
 */
export const unsubscribeUser = async (
  userId: string,
  emailAddress: string,
  reason?: string
): Promise<UserEmailPreferences> => {
  const supabase = getSupabaseAdmin();

  // Get current preferences
  const preferences = await getUserEmailPreferences(userId, emailAddress);
  const hadNewsletter = preferences?.email_topics?.includes('newsletter') || false;

  // Update preferences
  const { data: updated, error: updateError } = await supabase
    .from('user_email_preferences')
    .update({
      marketing_emails_enabled: false,
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_reason: reason || null,
    })
    .eq('user_id', userId)
    .eq('email_address', emailAddress)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to unsubscribe user: ${updateError.message}`);
  }

  // Cancel all scheduled marketing emails
  await cancelScheduledMarketingEmails(userId, emailAddress);

  // Sync to ConvertKit if newsletter was enabled
  if (hadNewsletter && preferences?.convertkit_subscriber_id) {
    try {
      // Note: ConvertKit unsubscribe will be handled in convertkit-sync.ts (Milestone 10)
      // For now, we'll just log that sync is needed
      console.log(`[unsubscribeUser] Newsletter was enabled, ConvertKit sync needed for ${emailAddress}`);
    } catch (error) {
      // Don't fail unsubscribe if ConvertKit sync fails
      console.error('[unsubscribeUser] Failed to sync unsubscribe to ConvertKit:', error);
    }
  }

  return updated as UserEmailPreferences;
};

/**
 * Resubscribe user to marketing emails
 * 
 * - Sets marketing_emails_enabled = true
 * - Clears unsubscribed_at timestamp
 * - Syncs to ConvertKit if newsletter preference is enabled
 * 
 * @param userId User UUID
 * @param emailAddress Email address
 * @returns Updated preferences record
 */
export const resubscribeUser = async (
  userId: string,
  emailAddress: string
): Promise<UserEmailPreferences> => {
  const supabase = getSupabaseAdmin();

  // Get current preferences
  const preferences = await getUserEmailPreferences(userId, emailAddress);
  const hasNewsletter = preferences?.email_topics?.includes('newsletter') || false;

  // Update preferences
  const { data: updated, error: updateError } = await supabase
    .from('user_email_preferences')
    .update({
      marketing_emails_enabled: true,
      unsubscribed_at: null,
      unsubscribe_reason: null,
    })
    .eq('user_id', userId)
    .eq('email_address', emailAddress)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to resubscribe user: ${updateError.message}`);
  }

  // Sync to ConvertKit if newsletter preference is enabled
  if (hasNewsletter) {
    try {
      const CONVERTKIT_NEWSLETTER_FORM_ID = parseInt(process.env.CONVERTKIT_NEWSLETTER_FORM_ID || '7348426');
      await addSubscriberToForm(CONVERTKIT_NEWSLETTER_FORM_ID, emailAddress);
      console.log(`[resubscribeUser] Synced resubscribe to ConvertKit for ${emailAddress}`);
    } catch (error) {
      // Don't fail resubscribe if ConvertKit sync fails
      console.error('[resubscribeUser] Failed to sync resubscribe to ConvertKit:', error);
    }
  }

  return updated as UserEmailPreferences;
};

/**
 * Update user email preferences
 * 
 * @param userId User UUID
 * @param emailAddress Email address
 * @param updates Preference updates
 * @returns Updated preferences record
 */
export const updateEmailPreferences = async (
  userId: string,
  emailAddress: string,
  updates: {
    marketing_emails_enabled?: boolean;
    email_topics?: string[];
    unsubscribe_reason?: string | null;
  }
): Promise<UserEmailPreferences> => {
  const supabase = getSupabaseAdmin();

  // Get current preferences
  const currentPreferences = await getUserEmailPreferences(userId, emailAddress);
  const hadNewsletter = currentPreferences?.email_topics?.includes('newsletter') || false;
  const willHaveNewsletter = updates.email_topics?.includes('newsletter') || false;

  // If disabling marketing emails, cancel scheduled emails
  if (updates.marketing_emails_enabled === false && currentPreferences?.marketing_emails_enabled) {
    await cancelScheduledMarketingEmails(userId, emailAddress);
  }

  // Build update object
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.marketing_emails_enabled !== undefined) {
    updateData.marketing_emails_enabled = updates.marketing_emails_enabled;
    if (updates.marketing_emails_enabled === false) {
      updateData.unsubscribed_at = new Date().toISOString();
    } else {
      updateData.unsubscribed_at = null;
      updateData.unsubscribe_reason = null;
    }
  }

  if (updates.email_topics !== undefined) {
    updateData.email_topics = updates.email_topics;
  }

  if (updates.unsubscribe_reason !== undefined) {
    updateData.unsubscribe_reason = updates.unsubscribe_reason;
  }

  // Update preferences
  const { data: updated, error: updateError } = await supabase
    .from('user_email_preferences')
    .update(updateData)
    .eq('user_id', userId)
    .eq('email_address', emailAddress)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update email preferences: ${updateError.message}`);
  }

  // Sync ConvertKit if newsletter preference changed
  if (hadNewsletter !== willHaveNewsletter) {
    try {
      const CONVERTKIT_NEWSLETTER_FORM_ID = parseInt(process.env.CONVERTKIT_NEWSLETTER_FORM_ID || '7348426');
      if (willHaveNewsletter) {
        await addSubscriberToForm(CONVERTKIT_NEWSLETTER_FORM_ID, emailAddress);
        console.log(`[updateEmailPreferences] Synced newsletter subscribe to ConvertKit for ${emailAddress}`);
      } else {
        // Note: ConvertKit unsubscribe will be handled in convertkit-sync.ts (Milestone 10)
        console.log(`[updateEmailPreferences] Newsletter disabled, ConvertKit unsubscribe needed for ${emailAddress}`);
      }
    } catch (error) {
      // Don't fail update if ConvertKit sync fails
      console.error('[updateEmailPreferences] Failed to sync to ConvertKit:', error);
    }
  }

  return updated as UserEmailPreferences;
};

/**
 * Generate unsubscribe token for user
 * 
 * Creates a secure token in email_unsubscribe_tokens table
 * Token expires after 30 days
 * 
 * @param userId User UUID
 * @param emailAddress Email address
 * @returns Unsubscribe token
 */
export const generateUnsubscribeToken = async (
  userId: string,
  emailAddress: string
): Promise<string> => {
  const supabase = getSupabaseAdmin();
  const crypto = await import('crypto');

  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex');

  // Calculate expiration (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Insert token
  const { error: insertError } = await supabase
    .from('email_unsubscribe_tokens')
    .insert({
      user_id: userId,
      email_address: emailAddress,
      token,
      expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    throw new Error(`Failed to generate unsubscribe token: ${insertError.message}`);
  }

  return token;
};

/**
 * Validate unsubscribe token (without marking as used)
 * 
 * Checks if token exists, is not expired, and hasn't been used
 * Does NOT mark token as used (call markTokenAsUsed separately)
 * 
 * @param token Unsubscribe token
 * @returns Token record with user info or null if invalid
 */
export const validateUnsubscribeToken = async (token: string): Promise<{
  userId: string;
  emailAddress: string;
  used: boolean;
} | null> => {
  const supabase = getSupabaseAdmin();

  const { data: tokenRecord, error } = await supabase
    .from('email_unsubscribe_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to validate token: ${error.message}`);
  }

  if (!tokenRecord) {
    return null; // Token not found
  }

  // Check if token is expired
  const expiresAt = new Date(tokenRecord.expires_at);
  if (expiresAt < new Date()) {
    return null; // Token expired
  }

  // Check if token has been used
  if (tokenRecord.used_at) {
    return {
      userId: tokenRecord.user_id,
      emailAddress: tokenRecord.email_address,
      used: true,
    };
  }

  return {
    userId: tokenRecord.user_id,
    emailAddress: tokenRecord.email_address,
    used: false,
  };
};

/**
 * Mark unsubscribe token as used
 * 
 * @param token Unsubscribe token
 */
export const markTokenAsUsed = async (token: string): Promise<void> => {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('email_unsubscribe_tokens')
    .update({
      used_at: new Date().toISOString(),
    })
    .eq('token', token);

  if (error) {
    throw new Error(`Failed to mark token as used: ${error.message}`);
  }
};

