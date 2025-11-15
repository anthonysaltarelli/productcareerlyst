import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/resume/versions/[versionId]/contact - Upsert contact info
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

    // Upsert contact info
    const { data, error } = await supabase
      .from('resume_contact_info')
      .upsert({
        version_id: versionId,
        full_name: body.full_name,
        email: body.email,
        phone: body.phone || null,
        location: body.location || null,
        linkedin: body.linkedin || null,
        portfolio: body.portfolio || null,
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
