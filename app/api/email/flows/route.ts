import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminStatus } from '@/lib/utils/admin';
import { getAllFlows } from '@/lib/email/flows';

/**
 * GET /api/email/flows
 * List all email flows
 */
export async function GET() {
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

    const flows = await getAllFlows();

    return NextResponse.json({ flows });
  } catch (error) {
    console.error('Error fetching flows:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch flows';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


