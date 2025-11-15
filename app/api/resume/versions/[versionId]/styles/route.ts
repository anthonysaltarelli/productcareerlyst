import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/resume/versions/[versionId]/styles - Upsert styles
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

    // Upsert styles
    const { data, error } = await supabase
      .from('resume_styles')
      .upsert({
        version_id: versionId,
        font_family: body.font_family || 'Arial',
        font_size: body.font_size || 11,
        line_height: body.line_height || 1.15,
        margin_top: body.margin_top || 0.5,
        margin_bottom: body.margin_bottom || 0.5,
        margin_left: body.margin_left || 0.75,
        margin_right: body.margin_right || 0.75,
        accent_color: body.accent_color || '#000000',
        heading_color: body.heading_color || '#000000',
        text_color: body.text_color || '#000000',
      }, {
        onConflict: 'version_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting styles:', error);
      return NextResponse.json(
        { error: 'Failed to save styles' },
        { status: 500 }
      );
    }

    return NextResponse.json({ styles: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

