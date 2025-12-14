import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface EndMockInterviewRequest {
  early_exit?: boolean;
}

/**
 * POST /api/mock-interviews/[id]/end
 * End a mock interview session (either early exit or normal completion)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as EndMockInterviewRequest;

    // Verify the interview belongs to the user
    const { data: interview, error: fetchError } = await supabase
      .from('mock_interviews')
      .select('id, status, started_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Calculate duration if started_at exists
    let durationSeconds: number | null = null;
    if (interview.started_at) {
      const startedAt = new Date(interview.started_at);
      const now = new Date();
      durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    }

    // Update the interview status
    const { error: updateError } = await supabase
      .from('mock_interviews')
      .update({
        status: body.early_exit ? 'failed' : 'completed',
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error ending mock interview:', updateError);
      return NextResponse.json(
        { error: 'Failed to end mock interview' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      interviewId: id,
      earlyExit: body.early_exit || false,
      durationSeconds,
    });
  } catch (error) {
    console.error('Error in mock interviews end API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
