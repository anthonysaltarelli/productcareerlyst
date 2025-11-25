import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/jobs/interviews/[id]/questions/[questionId] - Update a question
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: interviewId, questionId } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify interview belongs to user
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id, user_id')
      .eq('id', interviewId)
      .eq('user_id', user.id)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: { question?: string; answer?: string } = {};

    if (body.question !== undefined) {
      if (typeof body.question !== 'string' || body.question.trim().length === 0) {
        return NextResponse.json(
          { error: 'Question cannot be empty' },
          { status: 400 }
        );
      }
      updateData.question = body.question.trim();
    }

    if (body.answer !== undefined) {
      updateData.answer = body.answer?.trim() || null;
    }

    // Update question
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('interview_questions')
      .update(updateData)
      .eq('id', questionId)
      .eq('interview_id', interviewId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating question:', updateError);
      return NextResponse.json(
        { error: 'Failed to update question' },
        { status: 500 }
      );
    }

    if (!updatedQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ question: updatedQuestion });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// DELETE /api/jobs/interviews/[id]/questions/[questionId] - Delete a question
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: interviewId, questionId } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify interview belongs to user
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id, user_id')
      .eq('id', interviewId)
      .eq('user_id', user.id)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Delete question
    const { error: deleteError } = await supabase
      .from('interview_questions')
      .delete()
      .eq('id', questionId)
      .eq('interview_id', interviewId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting question:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete question' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Question deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};



