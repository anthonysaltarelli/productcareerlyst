import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminStatus } from '@/lib/utils/admin';
import { cancelSequence } from '@/lib/email/service';

/**
 * POST /api/email/flows/cancel
 * Cancel an email flow instance
 * 
 * Body (one of):
 *   Option 1: { flowTriggerId: string } - Cancel by flow trigger ID (recommended for testing)
 *   Option 2: { userId: string, flowId: string } - Cancel by user + flow
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
    const { userId, flowId, flowTriggerId } = body;

    // Validate: either flowTriggerId OR (userId + flowId) must be provided
    if (!flowTriggerId && (!userId || !flowId)) {
      return NextResponse.json(
        { error: 'Either flowTriggerId or both userId and flowId must be provided' },
        { status: 400 }
      );
    }

    // Cancel the sequence
    const cancelledCount = await cancelSequence(flowTriggerId, userId, flowId);

    return NextResponse.json({
      success: true,
      cancelledCount,
    });
  } catch (error) {
    console.error('Error cancelling flow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel flow';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

