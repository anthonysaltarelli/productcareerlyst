import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/mock-interviews
 * Fetch all mock interviews for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: interviews, error: fetchError } = await supabase
      .from('mock_interviews')
      .select(
        'id, status, started_at, ended_at, duration_seconds, call_quality_rating, self_performance_rating, created_at'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching mock interviews:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
    }

    return NextResponse.json({ interviews: interviews || [] });
  } catch (error) {
    console.error('Error in mock interviews API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
