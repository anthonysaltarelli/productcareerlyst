import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/resume/versions/[versionId]/education - Create education entry
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) => {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { versionId } = await params;
    const body = await request.json();

    if (!body.school || !body.degree) {
      return NextResponse.json(
        { error: 'School and degree are required' },
        { status: 400 }
      );
    }

    // Verify version ownership
    const { data: version } = await supabase
      .from('resume_versions')
      .select('id')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single();

    if (!version) {
      return NextResponse.json(
        { error: 'Resume version not found' },
        { status: 404 }
      );
    }

    // Create education
    const { data, error } = await supabase
      .from('resume_education')
      .insert({
        version_id: versionId,
        school: body.school,
        degree: body.degree,
        field: body.field || null,
        location: body.location || null,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        gpa: body.gpa || null,
        display_order: body.display_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating education:', error);
      return NextResponse.json(
        { error: 'Failed to create education entry' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { education: data },
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

