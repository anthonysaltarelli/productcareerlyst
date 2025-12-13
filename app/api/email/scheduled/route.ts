import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminStatus } from '@/lib/utils/admin';
import { getAllScheduledEmails, getScheduledEmailsForUser } from '@/lib/email/service';

/**
 * GET /api/email/scheduled
 * Get scheduled emails (admin only)
 * Query params: userId (optional), status (optional), isTest (optional), emailAddress (optional), limit (optional)
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const isTest = searchParams.get('isTest');
    const emailAddress = searchParams.get('emailAddress');
    const limit = searchParams.get('limit');

    // If userId provided, get emails for that user
    if (userId) {
      const scheduledEmails = await getScheduledEmailsForUser(userId, true);
      return NextResponse.json({
        success: true,
        scheduledEmails,
      });
    }

    // Otherwise, get all scheduled emails with filters
    const scheduledEmails = await getAllScheduledEmails({
      userId: userId || undefined,
      status: status || undefined,
      isTest: isTest === 'true' ? true : isTest === 'false' ? false : undefined,
      emailAddress: emailAddress || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({
      success: true,
      scheduledEmails,
    });
  } catch (error) {
    console.error('Error getting scheduled emails:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}



