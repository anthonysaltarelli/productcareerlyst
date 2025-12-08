import { Resend } from 'resend';

/**
 * Resend Client for Email System
 * 
 * Provides functions for sending, scheduling, and canceling emails via Resend API.
 * Handles error cases gracefully and validates environment variables.
 */

// Initialize Resend client
let resendClient: Resend | null = null;

/**
 * Get or create Resend client instance
 * Validates environment variables and throws if missing
 */
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
 * Validate required environment variables
 */
const validateEnv = (): void => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is required');
  }
  if (!process.env.RESEND_FROM_EMAIL) {
    throw new Error('RESEND_FROM_EMAIL environment variable is required');
  }
};

/**
 * Email send parameters
 */
export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string | string[];
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Schedule email parameters
 */
export interface ScheduleEmailParams extends SendEmailParams {
  scheduledAt: string; // ISO 8601 timestamp
}

/**
 * Response from Resend API
 */
export interface ResendEmailResponse {
  id: string; // resend_email_id
  scheduledId?: string; // resend_scheduled_id (if scheduled)
}

/**
 * Send email immediately via Resend
 * 
 * @param params Email parameters
 * @returns Resend email ID
 * @throws Error if API call fails or environment variables are missing
 */
export const sendEmail = async (params: SendEmailParams): Promise<ResendEmailResponse> => {
  try {
    validateEnv();
    const resend = getResendClient();

    const fromEmail = params.from || process.env.RESEND_FROM_EMAIL!;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo,
      headers: params.headers,
      tags: params.tags,
    });

    if (error) {
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    if (!data?.id) {
      throw new Error('Resend API returned no email ID');
    }

    return {
      id: data.id,
    };
  } catch (error) {
    // Re-throw with context
    if (error instanceof Error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
    throw new Error(`Failed to send email: ${String(error)}`);
  }
};

/**
 * Schedule email for future delivery via Resend
 * 
 * @param params Email parameters with scheduledAt timestamp (ISO 8601)
 * @returns Resend email ID and scheduled ID
 * @throws Error if API call fails or environment variables are missing
 */
export const scheduleEmail = async (
  params: ScheduleEmailParams
): Promise<ResendEmailResponse> => {
  try {
    validateEnv();
    const resend = getResendClient();

    const fromEmail = params.from || process.env.RESEND_FROM_EMAIL!;

    // Validate scheduledAt is in the future
    const scheduledDate = new Date(params.scheduledAt);
    const now = new Date();
    if (scheduledDate <= now) {
      throw new Error('scheduledAt must be in the future');
    }

    // Validate scheduledAt is within 30 days (Resend limit)
    const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (scheduledDate > maxDate) {
      throw new Error('scheduledAt cannot be more than 30 days in the future');
    }

    // Send email with scheduledAt parameter (camelCase for Node.js SDK)
    const sendParams: any = {
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo,
      headers: params.headers,
      tags: params.tags,
      scheduledAt: params.scheduledAt, // ISO 8601 format - camelCase for Node.js SDK
    };

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Resend] Scheduling email with params:', {
        to: params.to,
        scheduledAt: params.scheduledAt,
        scheduledDate: new Date(params.scheduledAt).toISOString(),
        now: new Date().toISOString(),
        minutesFromNow: Math.round((new Date(params.scheduledAt).getTime() - Date.now()) / 1000 / 60),
        sendParamsKeys: Object.keys(sendParams),
        hasScheduledAt: 'scheduledAt' in sendParams,
      });
    }

    const { data, error } = await resend.emails.send(sendParams);

    // Debug logging for response
    if (process.env.NODE_ENV === 'development') {
      console.log('[Resend] API Response:', {
        emailId: data?.id,
        error: error ? JSON.stringify(error) : null,
      });
    }

    if (error) {
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    if (!data?.id) {
      throw new Error('Resend API returned no email ID');
    }

    return {
      id: data.id,
      scheduledId: data.id, // For scheduled emails, the ID is the scheduled ID
    };
  } catch (error) {
    // Re-throw with context
    if (error instanceof Error) {
      throw new Error(`Failed to schedule email: ${error.message}`);
    }
    throw new Error(`Failed to schedule email: ${String(error)}`);
  }
};

/**
 * Cancel a scheduled email via Resend
 * 
 * @param resendEmailId The Resend email ID to cancel
 * @returns Success status
 * @throws Error if API call fails or email cannot be cancelled
 */
export const cancelEmail = async (resendEmailId: string): Promise<void> => {
  try {
    validateEnv();
    const resend = getResendClient();

    if (!resendEmailId || typeof resendEmailId !== 'string') {
      throw new Error('resendEmailId is required and must be a string');
    }

    const { error } = await resend.emails.cancel(resendEmailId);

    if (error) {
      // Handle specific error cases
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        throw new Error(`Email with ID ${resendEmailId} not found or already sent/cancelled`);
      }
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }
  } catch (error) {
    // Re-throw with context
    if (error instanceof Error) {
      throw new Error(`Failed to cancel email: ${error.message}`);
    }
    throw new Error(`Failed to cancel email: ${String(error)}`);
  }
};

/**
 * Helper function to calculate scheduled timestamp from minutes offset
 * 
 * @param baseDate Base date to calculate from
 * @param minutesOffset Minutes to add (can be negative for past dates)
 * @returns ISO 8601 timestamp string
 */
export const calculateScheduledAt = (
  baseDate: Date = new Date(),
  minutesOffset: number
): string => {
  const scheduledDate = new Date(baseDate.getTime() + minutesOffset * 60 * 1000);
  return scheduledDate.toISOString();
};

