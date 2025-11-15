import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/resume/versions/[versionId]/summary - Upsert summary
export const PUT = async (
  request: NextRequest,
  { params }: { params: { versionId: string } }
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

    const versionId = params.versionId;
    const body = await request.json();

    if (!body.content) {
      return NextResponse.json(
        { error: 'Summary content is required' },
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

    // Upsert summary
    const { data, error } = await supabase
      .from('resume_summaries')
      .upsert({
        version_id: versionId,
        content: body.content,
      }, {
        onConflict: 'version_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting summary:', error);
      return NextResponse.json(
        { error: 'Failed to save summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
