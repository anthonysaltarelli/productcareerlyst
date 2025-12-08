import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminStatus } from '@/lib/utils/admin';
import { getFlowById, getFlowSteps } from '@/lib/email/flows';

/**
 * GET /api/email/flows/:id
 * Get flow details with steps
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: flowId } = await params;
    const flow = await getFlowById(flowId);

    if (!flow) {
      return NextResponse.json(
        { error: 'Flow not found' },
        { status: 404 }
      );
    }

    const steps = await getFlowSteps(flowId);

    return NextResponse.json({
      flow,
      steps,
    });
  } catch (error) {
    console.error('Error fetching flow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch flow';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

