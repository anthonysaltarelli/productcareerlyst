import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/resume/experiences/[experienceId] - Update experience
export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ experienceId: string }> }
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

    const { experienceId } = await params;
    const body = await request.json();

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

    // Update experience
    const { data, error } = await supabase
      .from('resume_experiences')
      .update({
        title: body.title,
        company: body.company,
        location: body.location,
        start_date: body.start_date,
        end_date: body.end_date,
        display_order: body.display_order,
      })
      .eq('id', experienceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating experience:', error);
      return NextResponse.json(
        { error: 'Failed to update experience' },
        { status: 500 }
      );
    }

    return NextResponse.json({ experience: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// DELETE /api/resume/experiences/[experienceId] - Delete experience
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ experienceId: string }> }
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

    const { experienceId } = await params;

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

    // Delete experience (bullets cascade)
    const { error } = await supabase
      .from('resume_experiences')
      .delete()
      .eq('id', experienceId);

    if (error) {
      console.error('Error deleting experience:', error);
      return NextResponse.json(
        { error: 'Failed to delete experience' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

