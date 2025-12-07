import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/jobs/interviews/[id]/interviewers - Add an interviewer to an interview
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
    const { contact_id, role } = body;

    if (!contact_id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Verify contact belongs to user
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('id', contact_id)
      .eq('user_id', user.id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Add interviewer
    const { data: interviewer, error: insertError } = await supabase
      .from('interview_interviewers')
      .insert({
        interview_id: interviewId,
        contact_id: contact_id,
        role: role || 'interviewer',
      })
      .select(`
        id,
        role,
        contact:contacts(*)
      `)
      .single();

    if (insertError) {
      console.error('Error adding interviewer:', insertError);
      return NextResponse.json(
        { error: 'Failed to add interviewer' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { interviewer },
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

// DELETE /api/jobs/interviews/[id]/interviewers - Remove an interviewer from an interview
export const DELETE = async (
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

    const searchParams = request.nextUrl.searchParams;
    const interviewerId = searchParams.get('interviewer_id');

    if (!interviewerId) {
      return NextResponse.json(
        { error: 'Interviewer ID is required' },
        { status: 400 }
      );
    }

    // Delete interviewer
    const { error: deleteError } = await supabase
      .from('interview_interviewers')
      .delete()
      .eq('id', interviewerId)
      .eq('interview_id', interviewId);

    if (deleteError) {
      console.error('Error removing interviewer:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove interviewer' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Interviewer removed successfully' },
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








