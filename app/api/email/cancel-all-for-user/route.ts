import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminStatus } from '@/lib/utils/admin';
import { cancelAllScheduledEmailsForUser } from '@/lib/email/service';

/**
 * POST /api/email/cancel-all-for-user
 * Cancel all scheduled emails for a user (admin only)
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
    const { userId } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Cancel all scheduled emails for user
    const cancelledCount = await cancelAllScheduledEmailsForUser(userId);

    return NextResponse.json({
      success: true,
      cancelledCount,
      message: `Successfully cancelled ${cancelledCount} scheduled email${cancelledCount !== 1 ? 's' : ''} for user`,
    });
  } catch (error) {
    console.error('Error cancelling all scheduled emails for user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}



