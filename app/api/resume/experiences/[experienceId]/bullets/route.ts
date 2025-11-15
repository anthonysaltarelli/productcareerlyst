import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/resume/experiences/[experienceId]/bullets - Create bullet
export const POST = async (
  request: NextRequest,
  { params }: { params: { experienceId: string } }
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

    const experienceId = params.experienceId;
    const body = await request.json();

    if (!body.content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verify ownership through version
    const { data: experience } = await supabase
      .from('resume_experiences')
      .select(`
        *,
        version:resume_versions(user_id)
      `)
      .eq('id', experienceId)
      .single();

    if (!experience || experience.version?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Experience not found' },
        { status: 404 }
      );
    }

    // Create bullet
    const { data, error } = await supabase
      .from('resume_experience_bullets')
      .insert({
        experience_id: experienceId,
        content: body.content,
        is_selected: body.is_selected !== undefined ? body.is_selected : true,
        display_order: body.display_order || 0,
        score: body.score || null,
        tags: body.tags || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bullet:', error);
      return NextResponse.json(
        { error: 'Failed to create bullet' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { bullet: data },
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

