import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch status history for this application
    // The RLS policy ensures users can only see their own data
    const { data: history, error } = await supabase
      .from('job_application_status_history')
      .select('id, old_status, new_status, changed_at')
      .eq('application_id', applicationId)
      .eq('user_id', user.id)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error fetching status history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch status history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ history: history || [] });
  } catch (error) {
    console.error('Error in status history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

