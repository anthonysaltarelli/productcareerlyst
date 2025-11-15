import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/resume/education/[educationId]/achievements - Create achievement
export const POST = async (
  request: NextRequest,
  { params }: { params: { educationId: string } }
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

    const educationId = params.educationId;
    const body = await request.json();

    if (!body.achievement) {
      return NextResponse.json(
        { error: 'Achievement text is required' },
        { status: 400 }
      );
    }

    // Verify ownership through version
    const { data: education } = await supabase
      .from('resume_education')
      .select(`
        *,
        version:resume_versions(user_id)
      `)
      .eq('id', educationId)
      .single();

    if (!education || education.version?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Education entry not found' },
        { status: 404 }
      );
    }

    // Create achievement
    const { data, error } = await supabase
      .from('resume_education_achievements')
      .insert({
        education_id: educationId,
        achievement: body.achievement,
        display_order: body.display_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating achievement:', error);
      return NextResponse.json(
        { error: 'Failed to create achievement' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { achievement: data },
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

