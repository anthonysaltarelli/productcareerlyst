import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/resume/versions/[versionId] - Get complete resume data for a specific version
export const GET = async (
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

    // Verify version ownership
    const { data: version, error: versionError } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single();

    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Resume version not found' },
        { status: 404 }
      );
    }

    // Fetch all related data in parallel
    const [
      { data: contactInfo },
      { data: summary },
      { data: experiences },
      { data: education },
      { data: skills },
      { data: styles },
    ] = await Promise.all([
      supabase
        .from('resume_contact_info')
        .select('*')
        .eq('version_id', versionId)
        .maybeSingle(),
      supabase
        .from('resume_summaries')
        .select('*')
        .eq('version_id', versionId)
        .maybeSingle(),
      supabase
        .from('resume_experiences')
        .select(`
          *,
          bullets:resume_experience_bullets(*)
        `)
        .eq('version_id', versionId)
        .order('display_order', { ascending: true }),
      supabase
        .from('resume_education')
        .select(`
          *,
          achievements:resume_education_achievements(*)
        `)
        .eq('version_id', versionId)
        .order('display_order', { ascending: true }),
      supabase
        .from('resume_skills')
        .select('*')
        .eq('version_id', versionId)
        .order('display_order', { ascending: true }),
      supabase
        .from('resume_styles')
        .select('*')
        .eq('version_id', versionId)
        .maybeSingle(),
    ]);

    // Group skills by category
    const groupedSkills = {
      technical: skills?.filter(s => s.category === 'technical') || [],
      product: skills?.filter(s => s.category === 'product') || [],
      soft: skills?.filter(s => s.category === 'soft') || [],
    };

    // Order bullets within each experience by display_order
    type Bullet = { display_order?: number | null };
    const experiencesWithOrderedBullets = experiences?.map(exp => ({
      ...exp,
      bullets: exp.bullets?.sort((a: Bullet, b: Bullet) => (a.display_order || 0) - (b.display_order || 0)) || [],
    })) || [];

    // Order achievements within each education by display_order
    type Achievement = { display_order?: number | null };
    const educationWithOrderedAchievements = education?.map(edu => ({
      ...edu,
      achievements: edu.achievements?.sort((a: Achievement, b: Achievement) => (a.display_order || 0) - (b.display_order || 0)) || [],
    })) || [];

    return NextResponse.json({
      version,
      contactInfo,
      summary: summary?.content || null, // Field is 'content', not 'summary'
      experiences: experiencesWithOrderedBullets,
      education: educationWithOrderedAchievements,
      skills: groupedSkills,
      styles,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// PATCH /api/resume/versions/[versionId] - Update a resume version
export const PATCH = async (
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

    // Verify version ownership
    const { data: version, error: versionError } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single();

    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Resume version not found' },
        { status: 404 }
      );
    }

    // Prepare update object (only allow certain fields)
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.is_master !== undefined) updates.is_master = body.is_master;
    if (body.application_id !== undefined) updates.application_id = body.application_id;

    // Update the version
    const { data: updatedVersion, error: updateError } = await supabase
      .from('resume_versions')
      .update(updates)
      .eq('id', versionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating resume version:', updateError);
      return NextResponse.json(
        { error: 'Failed to update resume version' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedVersion, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// DELETE /api/resume/versions/[versionId] - Delete a resume version
export const DELETE = async (
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

    // Verify version ownership
    const { data: version, error: versionError } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single();

    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Resume version not found' },
        { status: 404 }
      );
    }

    // Delete the version (cascade should handle related data)
    const { error: deleteError } = await supabase
      .from('resume_versions')
      .delete()
      .eq('id', versionId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting resume version:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete resume version' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
