import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/jobs/interviews - Get interviews for user (optionally filtered by application)
export const GET = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const applicationId = searchParams.get('application_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('interviews')
      .select(`
        *,
        application:job_applications(
          *,
          company:companies(*)
        )
      `)
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: true, nullsFirst: false });

    // Filter by application if provided
    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching interviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch interviews' },
        { status: 500 }
      );
    }

    return NextResponse.json({ interviews: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// POST /api/jobs/interviews - Create a new interview
export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.application_id || !body.title) {
      return NextResponse.json(
        { error: 'Application ID and title are required' },
        { status: 400 }
      );
    }

    // Create interview
    const { data, error } = await supabase
      .from('interviews')
      .insert({
        user_id: user.id,
        application_id: body.application_id,
        title: body.title,
        type: body.type,
        status: body.status || 'scheduled',
        scheduled_for: body.scheduled_for,
        duration_minutes: body.duration_minutes,
        location: body.location,
        meeting_link: body.meeting_link,
        prep_notes: body.prep_notes,
        feedback: body.feedback,
        outcome: body.outcome,
      })
      .select(`
        *,
        application:job_applications(
          *,
          company:companies(*)
        )
      `)
      .single();

    if (error) {
      console.error('Error creating interview:', error);
      return NextResponse.json(
        { error: 'Failed to create interview' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { interview: data },
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

