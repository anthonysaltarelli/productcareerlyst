import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminStatus } from '@/lib/utils/admin';
import { scheduleEmail } from '@/lib/email/service';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/email/schedule
 * Schedule a single email (admin only)
 */
export async function POST(request: NextRequest) {
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
    const {
      userId,
      emailAddress,
      templateId,
      scheduledAt,
      idempotencyKey,
      variables,
      unsubscribeUrl,
      isTest,
      metadata,
    } = body;

    // Validate required fields
    if (!emailAddress || typeof emailAddress !== 'string') {
      return NextResponse.json(
        { error: 'emailAddress is required' },
        { status: 400 }
      );
    }

    if (!templateId || typeof templateId !== 'string') {
      return NextResponse.json(
        { error: 'templateId is required' },
        { status: 400 }
      );
    }

    if (!scheduledAt || typeof scheduledAt !== 'string') {
      return NextResponse.json(
        { error: 'scheduledAt is required (ISO 8601 timestamp)' },
        { status: 400 }
      );
    }

    // Generate idempotency key if not provided
    const finalIdempotencyKey = idempotencyKey || `schedule-${uuidv4()}`;

    // Schedule email
    const scheduledEmail = await scheduleEmail({
      userId,
      emailAddress,
      templateId,
      scheduledAt,
      idempotencyKey: finalIdempotencyKey,
      variables,
      unsubscribeUrl,
      isTest: isTest || false,
      metadata,
    });

    return NextResponse.json({
      success: true,
      scheduledEmail,
    });
  } catch (error) {
    console.error('Error scheduling email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

