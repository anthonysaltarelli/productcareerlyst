import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminStatus } from '@/lib/utils/admin';
import { cancelEmail } from '@/lib/email/service';

/**
 * POST /api/email/cancel
 * Cancel a scheduled email (admin only)
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
    const { scheduledEmailId } = body;

    if (!scheduledEmailId || typeof scheduledEmailId !== 'string') {
      return NextResponse.json(
        { error: 'scheduledEmailId is required' },
        { status: 400 }
      );
    }

    // Cancel email
    const cancelledEmail = await cancelEmail(scheduledEmailId);

    return NextResponse.json({
      success: true,
      scheduledEmail: cancelledEmail,
    });
  } catch (error) {
    console.error('Error cancelling email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}



