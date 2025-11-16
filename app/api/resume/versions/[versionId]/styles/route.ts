import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/resume/versions/[versionId]/styles - Upsert styles
export const PUT = async (
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
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    console.log('Updating styles for version:', versionId, 'Body:', body);

    // Verify version ownership
    const { data: version, error: versionError } = await supabase
      .from('resume_versions')
      .select('id')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single();

    if (versionError || !version) {
      console.error('Version verification error:', versionError);
      return NextResponse.json(
        { error: 'Resume version not found or access denied' },
        { status: 404 }
      );
    }

    // Validate and prepare styles data
    const font_size = body.font_size ?? 11;
    const line_height = body.line_height ?? 1.15;
    const margin_top = body.margin_top ?? 0.5;
    const margin_bottom = body.margin_bottom ?? 0.5;
    const margin_left = body.margin_left ?? 0.75;
    const margin_right = body.margin_right ?? 0.75;
    const experience_display_mode = body.experience_display_mode || 'by_role';

    // Validate constraints (font_size now supports decimals, e.g., 10.5)
    if (font_size < 8.0 || font_size > 16.0) {
      return NextResponse.json(
        { error: `Invalid font_size: ${font_size}. Must be between 8.0 and 16.0` },
        { status: 400 }
      );
    }

    if (line_height < 0.5 || line_height > 3.0) {
      return NextResponse.json(
        { error: `Invalid line_height: ${line_height}. Must be between 0.5 and 3.0` },
        { status: 400 }
      );
    }

    const margins = { top: margin_top, bottom: margin_bottom, left: margin_left, right: margin_right };
    for (const [key, value] of Object.entries(margins)) {
      if (value < 0 || value > 2) {
        return NextResponse.json(
          { error: `Invalid margin_${key}: ${value}. Must be between 0 and 2` },
          { status: 400 }
        );
      }
    }

    if (experience_display_mode !== 'by_role' && experience_display_mode !== 'grouped') {
      return NextResponse.json(
        { error: `Invalid experience_display_mode: ${experience_display_mode}. Must be 'by_role' or 'grouped'` },
        { status: 400 }
      );
    }

    const stylesData = {
      version_id: versionId,
      font_family: body.font_family || 'Arial',
      font_size,
      line_height,
      margin_top,
      margin_bottom,
      margin_left,
      margin_right,
      accent_color: body.accent_color || '#000000',
      heading_color: body.heading_color || '#000000',
      text_color: body.text_color || '#000000',
      experience_display_mode,
    };

    console.log('Upserting styles with data:', stylesData);

    // Upsert styles
    const { data, error } = await supabase
      .from('resume_styles')
      .upsert(stylesData, {
        onConflict: 'version_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting styles:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      
      // Build error response with only serializable properties
      const errorResponse: any = {
        error: error.message || 'Failed to save styles',
      };
      
      if (error.details) errorResponse.details = error.details;
      if (error.hint) errorResponse.hint = error.hint;
      if (error.code) errorResponse.code = error.code;
      
      return NextResponse.json(errorResponse, { status: 500 });
    }

    if (!data) {
      console.error('Upsert succeeded but no data returned');
      return NextResponse.json(
        { error: 'Styles saved but no data returned' },
        { status: 500 }
      );
    }

    return NextResponse.json({ styles: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
};

