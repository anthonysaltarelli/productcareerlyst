import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/resume/versions/[versionId]/data - Get formatted resume data for PDF export
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

    // Format contact info for PDF export
    const formattedContactInfo = contactInfo ? {
      name: contactInfo.full_name || '',
      email: contactInfo.email || '',
      phone: contactInfo.phone || '',
      location: contactInfo.location || '',
      linkedin: contactInfo.linkedin || '',
      portfolio: contactInfo.portfolio || '',
    } : {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: '',
    };

    // Format experiences for PDF export
    const formattedExperiences = (experiences || []).map((exp: any) => ({
      id: exp.id,
      title: exp.title || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: exp.start_date || '',
      endDate: exp.end_date || '',
      roleGroupId: exp.role_group_id || null,
      bulletMode: exp.bullet_mode || 'per_role',
      bullets: (exp.bullets || [])
        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
        .map((bullet: any) => ({
          id: bullet.id,
          content: bullet.content || '',
          isSelected: bullet.is_selected ?? true,
        })),
    }));

    // Format education for PDF export
    const formattedEducation = (education || []).map((edu: any) => ({
      id: edu.id,
      school: edu.school || '',
      degree: edu.degree || '',
      field: edu.field || '',
      location: edu.location || '',
      startDate: edu.start_date || '',
      endDate: edu.end_date || '',
      gpa: edu.gpa || '',
      achievements: (edu.achievements || [])
        .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
        .map((ach: any) => ach.achievement || ''),
    }));

    // Format skills for PDF export (grouped by category)
    const formattedSkills = {
      technical: (skills || [])
        .filter((s: any) => s.category === 'technical' && s.skill_name)
        .map((s: any) => s.skill_name),
      product: (skills || [])
        .filter((s: any) => s.category === 'product' && s.skill_name)
        .map((s: any) => s.skill_name),
      soft: (skills || [])
        .filter((s: any) => s.category === 'soft' && s.skill_name)
        .map((s: any) => s.skill_name),
    };

    // Format styles for PDF export with defaults
    const formattedStyles = {
      fontFamily: styles?.font_family || 'Inter',
      fontSize: styles?.font_size || 10,
      lineHeight: styles?.line_height || '1.4',
      marginTop: styles?.margin_top || 0.5,
      marginBottom: styles?.margin_bottom || 0.5,
      marginLeft: styles?.margin_left || 0.5,
      marginRight: styles?.margin_right || 0.5,
      accentColor: styles?.accent_color || '#3B82F6',
      headingColor: styles?.heading_color || '#111827',
      textColor: styles?.text_color || '#374151',
      experienceDisplayMode: styles?.experience_display_mode || 'by_role',
    };

    return NextResponse.json({
      contactInfo: formattedContactInfo,
      summary: summary?.content || '',
      experiences: formattedExperiences,
      education: formattedEducation,
      skills: formattedSkills,
      styles: formattedStyles,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

