import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/jobs/interviews/[id]/questions - Get all questions for an interview
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: interviewId } = await params;
    
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

    // Get questions
    const { data: questions, error: questionsError } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('interview_id', interviewId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions: questions || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// POST /api/jobs/interviews/[id]/questions - Create a new question
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: interviewId } = await params;
    
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
    const { question, answer } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Create question
    const { data: newQuestion, error: insertError } = await supabase
      .from('interview_questions')
      .insert({
        user_id: user.id,
        interview_id: interviewId,
        question: question.trim(),
        answer: answer?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating question:', insertError);
      return NextResponse.json(
        { error: 'Failed to create question' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { question: newQuestion },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};




