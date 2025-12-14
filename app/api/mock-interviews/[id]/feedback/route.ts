import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface FeedbackRequest {
  call_quality_rating: number;
  call_quality_feedback?: string | null;
  self_performance_rating: number;
  self_performance_notes?: string | null;
}

/**
 * POST /api/mock-interviews/[id]/feedback
 * Submit user feedback for a mock interview
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
    const body: FeedbackRequest = await request.json();

    // Validate ratings
    if (
      !body.call_quality_rating ||
      body.call_quality_rating < 1 ||
      body.call_quality_rating > 5
    ) {
      return NextResponse.json(
        { error: 'Call quality rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (
      !body.self_performance_rating ||
      body.self_performance_rating < 1 ||
      body.self_performance_rating > 5
    ) {
      return NextResponse.json(
        { error: 'Self performance rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify the interview belongs to the user
    const { data: interview, error: fetchError } = await supabase
      .from('mock_interviews')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Update the interview with feedback
    const { error: updateError } = await supabase
      .from('mock_interviews')
      .update({
        call_quality_rating: body.call_quality_rating,
        call_quality_feedback: body.call_quality_feedback || null,
        self_performance_rating: body.self_performance_rating,
        self_performance_notes: body.self_performance_notes || null,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating mock interview feedback:', updateError);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback saved successfully',
    });
  } catch (error) {
    console.error('Error in mock interviews feedback API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
