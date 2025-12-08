import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, handleResendWebhook } from '@/lib/email/webhooks';

/**
 * POST /api/email/webhook
 * 
 * Resend webhook endpoint for email events.
 * 
 * Handles events:
 * - email.sent - Email was sent successfully
 * - email.delivered - Email delivered to recipient's mail server
 * - email.opened - Recipient opened the email
 * - email.clicked - Recipient clicked a link
 * - email.bounced - Email bounced
 * - email.complained - Email marked as spam
 * 
 * CRITICAL: Must use raw request body for signature verification.
 * The cryptographic signature is sensitive to even the slightest change.
 * 
 * Security:
 * - Verifies webhook signature using Resend SDK
 * - Uses Svix headers (svix-id, svix-timestamp, svix-signature)
 * - Requires RESEND_WEBHOOK_SECRET environment variable
 * 
 * Idempotency:
 * - Prevents duplicate event processing
 * - Uses unique constraint on (resend_email_id, event_type, occurred_at)
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Webhook] RESEND_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // CRITICAL: Get raw request body as string (not parsed JSON)
    // The signature verification requires the exact raw bytes Resend sent
    // Parsing and re-stringifying JSON will break the signature
    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      );
    }

    // Get Svix headers for signature verification
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    // Verify webhook signature
    let verifiedEvent;
    try {
      verifiedEvent = verifyWebhookSignature(
        rawBody,
        {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        },
        webhookSecret
      );
    } catch (error) {
      console.error('[Webhook] Signature verification failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        {
          error: 'Invalid webhook signature',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 400 }
      );
    }

    // Process webhook event
    const result = await handleResendWebhook(verifiedEvent);

    // Return success response
    return NextResponse.json({
      received: true,
      event_type: verifiedEvent.type,
      email_id: verifiedEvent.data.email_id,
      message: result.message,
    });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Return 500 error but don't expose internal details in production
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

