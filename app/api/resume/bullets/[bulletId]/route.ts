import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/resume/bullets/[bulletId] - Update bullet
export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ bulletId: string }> }
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

    const { bulletId } = await params;
    const body = await request.json();

    // Verify ownership through version
    const { data: bullet } = await supabase
      .from('resume_experience_bullets')
      .select(`
        *,
        experience:resume_experiences(
          version:resume_versions(user_id)
        )
      `)
      .eq('id', bulletId)
      .single();

    if (!bullet || bullet.experience?.version?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Bullet not found' },
        { status: 404 }
      );
    }

    // Update bullet
    const { data, error } = await supabase
      .from('resume_experience_bullets')
      .update({
        content: body.content,
        is_selected: body.is_selected,
        display_order: body.display_order,
        score: body.score,
        tags: body.tags,
      })
      .eq('id', bulletId)
      .select()
      .single();

    if (error) {
      console.error('Error updating bullet:', error);
      return NextResponse.json(
        { error: 'Failed to update bullet' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bullet: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// DELETE /api/resume/bullets/[bulletId] - Delete bullet
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ bulletId: string }> }
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

    const { bulletId } = await params;

    // Verify ownership through version
    const { data: bullet } = await supabase
      .from('resume_experience_bullets')
      .select(`
        *,
        experience:resume_experiences(
          version:resume_versions(user_id)
        )
      `)
      .eq('id', bulletId)
      .single();

    if (!bullet || bullet.experience?.version?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Bullet not found' },
        { status: 404 }
      );
    }

    // Delete bullet
    const { error } = await supabase
      .from('resume_experience_bullets')
      .delete()
      .eq('id', bulletId);

    if (error) {
      console.error('Error deleting bullet:', error);
      return NextResponse.json(
        { error: 'Failed to delete bullet' },
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

