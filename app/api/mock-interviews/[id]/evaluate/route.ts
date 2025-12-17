import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';

// POST /api/mock-interviews/[id]/evaluate - Trigger AI evaluation of interview (async via Inngest)
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
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

    // Fetch the interview to validate it exists and belongs to user
    const { data: interview, error: fetchError } = await supabase
      .from('mock_interviews')
      .select(`
        id,
        user_id,
        transcript,
        ai_evaluation,
        ai_evaluation_status,
        interview_mode
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Check if evaluation is already in progress
    if (interview.ai_evaluation_status === 'processing') {
      return NextResponse.json({
        success: true,
        status: 'processing',
        message: 'Evaluation is already in progress',
      });
    }

    // Check if evaluation already exists
    if (interview.ai_evaluation && interview.ai_evaluation_status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        evaluation: interview.ai_evaluation,
      });
    }

    // Check for transcript
    if (!interview.transcript || interview.transcript.length === 0) {
      return NextResponse.json(
        { error: 'No transcript available. Please wait for the transcript to be processed.' },
        { status: 400 }
      );
    }

    // Set status to processing
    const { error: updateError } = await supabase
      .from('mock_interviews')
      .update({
        ai_evaluation_status: 'processing',
        ai_evaluation_error: null,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating evaluation status:', updateError);
      return NextResponse.json({ error: 'Failed to start evaluation' }, { status: 500 });
    }

    // Fire Inngest event to process evaluation in background
    try {
      await inngest.send({
        name: 'interview/evaluation.requested',
        data: {
          interviewId: id,
          userId: user.id,
          interviewMode: interview.interview_mode || 'full',
        },
      });

      console.log('[Evaluate API] Inngest event sent', { interviewId: id, userId: user.id });
    } catch (inngestError) {
      console.error('[Evaluate API] Failed to send Inngest event:', inngestError);

      // Reset status on failure
      await supabase
        .from('mock_interviews')
        .update({
          ai_evaluation_status: 'failed',
          ai_evaluation_error: 'Failed to start background evaluation',
        })
        .eq('id', id)
        .eq('user_id', user.id);

      return NextResponse.json(
        { error: 'Failed to start evaluation process' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: 'processing',
      message: 'Evaluation started. Poll for results.',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};
