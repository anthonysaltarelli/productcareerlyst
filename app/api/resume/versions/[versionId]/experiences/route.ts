import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/resume/versions/[versionId]/experiences - Create new experience
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

    if (!body.title || !body.company) {
      return NextResponse.json(
        { error: 'Title and company are required' },
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

    // Create experience
    const { data, error } = await supabase
      .from('resume_experiences')
      .insert({
        version_id: versionId,
        title: body.title,
        company: body.company,
        location: body.location || null,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        display_order: body.display_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating experience:', error);
      return NextResponse.json(
        { error: 'Failed to create experience' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { experience: data },
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

