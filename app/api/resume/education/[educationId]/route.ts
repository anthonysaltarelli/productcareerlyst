import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/resume/education/[educationId] - Update education
export const PUT = async (
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

    // Update education
    const { data, error } = await supabase
      .from('resume_education')
      .update({
        school: body.school,
        degree: body.degree,
        field: body.field,
        location: body.location,
        start_date: body.start_date,
        end_date: body.end_date,
        gpa: body.gpa,
        display_order: body.display_order,
      })
      .eq('id', educationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating education:', error);
      return NextResponse.json(
        { error: 'Failed to update education entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ education: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// DELETE /api/resume/education/[educationId] - Delete education
export const DELETE = async (
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

    // Delete education (achievements cascade)
    const { error } = await supabase
      .from('resume_education')
      .delete()
      .eq('id', educationId);

    if (error) {
      console.error('Error deleting education:', error);
      return NextResponse.json(
        { error: 'Failed to delete education entry' },
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

