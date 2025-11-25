import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/resume/versions - Get all resume versions for current user
// Query params:
//   - applicationId: Filter by job application ID
export const GET = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const applicationId = searchParams.get('applicationId');

    let query = supabase
      .from('resume_versions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Filter by application_id if provided
    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching resume versions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch resume versions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ versions: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// POST /api/resume/versions - Create a new resume version
export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Create version
    const { data, error } = await supabase
      .from('resume_versions')
      .insert({
        user_id: user.id,
        name: body.name,
        slug: body.slug,
        is_master: body.is_master || false,
        application_id: body.application_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating resume version:', error);
      return NextResponse.json(
        { error: 'Failed to create resume version' },
        { status: 500 }
      );
    }

    // Initialize default styles for the new version
    if (data) {
      const { error: stylesError } = await supabase
        .from('resume_styles')
        .insert({
          version_id: data.id,
        });

      if (stylesError) {
        console.error('Error creating default styles:', stylesError);
      }
    }

    return NextResponse.json(
      { version: data },
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

