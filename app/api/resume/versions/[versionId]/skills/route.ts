import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/resume/versions/[versionId]/skills - Create skill
export const POST = async (
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

    if (!body.category || !body.skill_name) {
      return NextResponse.json(
        { error: 'Category and skill name are required' },
        { status: 400 }
      );
    }

    if (!['technical', 'product', 'soft'].includes(body.category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be technical, product, or soft' },
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

    // Create skill
    const { data, error } = await supabase
      .from('resume_skills')
      .insert({
        version_id: versionId,
        category: body.category,
        skill_name: body.skill_name,
        display_order: body.display_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating skill:', error);
      return NextResponse.json(
        { error: 'Failed to create skill' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { skill: data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// PUT /api/resume/versions/[versionId]/skills - Batch update skills for a category
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

    if (!body.category || !body.skills) {
      return NextResponse.json(
        { error: 'Category and skills array are required' },
        { status: 400 }
      );
    }

    if (!['technical', 'product', 'soft'].includes(body.category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be technical, product, or soft' },
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

    // Delete existing skills in this category
    await supabase
      .from('resume_skills')
      .delete()
      .eq('version_id', versionId)
      .eq('category', body.category);

    // Insert new skills
    if (body.skills.length > 0) {
      const skillsToInsert = body.skills.map((skill: string, index: number) => ({
        version_id: versionId,
        category: body.category,
        skill_name: skill,
        display_order: index,
      }));

      const { data, error } = await supabase
        .from('resume_skills')
        .insert(skillsToInsert)
        .select();

      if (error) {
        console.error('Error updating skills:', error);
        return NextResponse.json(
          { error: 'Failed to update skills' },
          { status: 500 }
        );
      }

      return NextResponse.json({ skills: data });
    }

    return NextResponse.json({ skills: [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

