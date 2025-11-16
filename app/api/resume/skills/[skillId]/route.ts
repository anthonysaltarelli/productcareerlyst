import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// DELETE /api/resume/skills/[skillId] - Delete skill
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
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

    const { skillId } = await params;

    // Verify ownership through version
    const { data: skill } = await supabase
      .from('resume_skills')
      .select(`
        *,
        version:resume_versions(user_id)
      `)
      .eq('id', skillId)
      .single();

    if (!skill || skill.version?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Delete skill
    const { error } = await supabase
      .from('resume_skills')
      .delete()
      .eq('id', skillId);

    if (error) {
      console.error('Error deleting skill:', error);
      return NextResponse.json(
        { error: 'Failed to delete skill' },
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

