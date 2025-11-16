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
    const experiencesWithOrderedBullets = experiences?.map(exp => ({
      ...exp,
      bullets: exp.bullets?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)) || [],
    })) || [];

    // Order achievements within each education by display_order
    const educationWithOrderedAchievements = education?.map(edu => ({
      ...edu,
      achievements: edu.achievements?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)) || [],
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
