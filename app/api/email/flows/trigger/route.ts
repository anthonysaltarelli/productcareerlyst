import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminStatus } from '@/lib/utils/admin';
import { scheduleSequence } from '@/lib/email/service';

/**
 * POST /api/email/flows/trigger
 * Trigger an email flow for a user
 * 
 * Body: {
 *   flowId: string;
 *   userId?: string;
 *   emailAddress: string;
 *   isTest?: boolean;
 *   variables?: Record<string, any>;
 * }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin status
    const isAdmin = await checkAdminStatus(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { flowId, userId, emailAddress, isTest = true, variables } = body;

    if (!flowId) {
      return NextResponse.json(
        { error: 'flowId is required' },
        { status: 400 }
      );
    }

    if (!emailAddress) {
      return NextResponse.json(
        { error: 'emailAddress is required' },
        { status: 400 }
      );
    }

    // Generate idempotency key prefix and trigger event ID
    const triggerEventId = `manual_trigger_${Date.now()}`;
    const idempotencyKeyPrefix = `flow_${flowId}_${userId || 'anonymous'}_${Date.now()}`;

    // Schedule the sequence
    const scheduledEmails = await scheduleSequence({
      userId,
      emailAddress,
      flowId,
      idempotencyKeyPrefix,
      triggerEventId,
      variables: variables || {},
      isTest,
      testModeMultiplier: 1, // In test mode, 1 minute = 1 day (use as-is)
    });

    console.log(`[Flow Trigger] Scheduled ${scheduledEmails.length} emails for flow ${flowId}`);

    return NextResponse.json({
      success: true,
      scheduledEmails,
      count: scheduledEmails.length,
    });
  } catch (error) {
    console.error('Error triggering flow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to trigger flow';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

