import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/resume/achievements/[achievementId] - Update achievement
export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ achievementId: string }> }
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

    const { achievementId } = await params;
    const body = await request.json();

    // Verify ownership through version
    const { data: achievement } = await supabase
      .from('resume_education_achievements')
      .select(`
        *,
        education:resume_education(
          version:resume_versions(user_id)
        )
      `)
      .eq('id', achievementId)
      .single();

    if (!achievement || achievement.education?.version?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      );
    }

    // Update achievement
    const { data, error } = await supabase
      .from('resume_education_achievements')
      .update({
        achievement: body.achievement,
        display_order: body.display_order,
      })
      .eq('id', achievementId)
      .select()
      .single();

    if (error) {
      console.error('Error updating achievement:', error);
      return NextResponse.json(
        { error: 'Failed to update achievement' },
        { status: 500 }
      );
    }

    return NextResponse.json({ achievement: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// DELETE /api/resume/achievements/[achievementId] - Delete achievement
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ achievementId: string }> }
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

    const { achievementId } = await params;

    // Verify ownership through version
    const { data: achievement } = await supabase
      .from('resume_education_achievements')
      .select(`
        *,
        education:resume_education(
          version:resume_versions(user_id)
        )
      `)
      .eq('id', achievementId)
      .single();

    if (!achievement || achievement.education?.version?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      );
    }

    // Delete achievement
    const { error } = await supabase
      .from('resume_education_achievements')
      .delete()
      .eq('id', achievementId);

    if (error) {
      console.error('Error deleting achievement:', error);
      return NextResponse.json(
        { error: 'Failed to delete achievement' },
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

