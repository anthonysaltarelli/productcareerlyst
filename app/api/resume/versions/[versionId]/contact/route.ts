import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/resume/versions/[versionId]/contact - Upsert contact info
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
    const body = await request.json();

    // Validate required fields
    if (!body.full_name || body.full_name.trim() === '') {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    }

    if (!body.email || body.email.trim() === '') {
      return NextResponse.json(
        { error: 'Email is required' },
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

    // Upsert contact info
    const { data, error } = await supabase
      .from('resume_contact_info')
      .upsert({
        version_id: versionId,
        full_name: body.full_name.trim(),
        email: body.email.trim(),
        phone: body.phone?.trim() || null,
        location: body.location?.trim() || null,
        linkedin: body.linkedin?.trim() || null,
        portfolio: body.portfolio?.trim() || null,
      }, {
        onConflict: 'version_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting contact info:', error);
      return NextResponse.json(
        { error: 'Failed to save contact info' },
        { status: 500 }
      );
    }

    return NextResponse.json({ contactInfo: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
