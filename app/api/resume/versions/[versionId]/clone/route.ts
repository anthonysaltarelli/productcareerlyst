import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/resume/versions/[versionId]/clone - Clone a resume version (typically from master)
export const POST = async (
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

    if (!body.newName) {
      return NextResponse.json(
        { error: 'newName is required' },
        { status: 400 }
      );
    }

    // Verify source version ownership
    const { data: sourceVersion, error: versionError } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single();

    if (versionError || !sourceVersion) {
      return NextResponse.json(
        { error: 'Source resume version not found' },
        { status: 404 }
      );
    }

    // Generate slug from newName (simple version)
    const slug = body.newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Determine if cloning to master or job-specific
    const isMaster = body.isMaster === true;

    // Create new version
    const { data: newVersion, error: createError } = await supabase
      .from('resume_versions')
      .insert({
        user_id: user.id,
        name: body.newName,
        slug: slug,
        is_master: isMaster,
        application_id: isMaster ? null : (body.applicationId || null), // Masters never have application_id
      })
      .select()
      .single();

    if (createError || !newVersion) {
      console.error('Error creating new version:', createError);
      return NextResponse.json(
        { error: 'Failed to create new version' },
        { status: 500 }
      );
    }

    // Fetch all data from source version in parallel
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

    // Clone contact info
    if (contactInfo) {
      const { error: contactError } = await supabase
        .from('resume_contact_info')
        .insert({
          version_id: newVersion.id,
          full_name: contactInfo.full_name,
          email: contactInfo.email,
          phone: contactInfo.phone,
          location: contactInfo.location,
          linkedin: contactInfo.linkedin,
          portfolio: contactInfo.portfolio,
        });

      if (contactError) {
        console.error('Error cloning contact info:', contactError);
      }
    }

    // Clone summary
    if (summary) {
      const { error: summaryError } = await supabase
        .from('resume_summaries')
        .insert({
          version_id: newVersion.id,
          content: summary.content,
        });

      if (summaryError) {
        console.error('Error cloning summary:', summaryError);
      }
    }

    // Clone experiences with bullets
    if (experiences && experiences.length > 0) {
      for (const exp of experiences) {
        const { data: newExp, error: expError } = await supabase
          .from('resume_experiences')
          .insert({
            version_id: newVersion.id,
            title: exp.title,
            company: exp.company,
            location: exp.location,
            start_date: exp.start_date,
            end_date: exp.end_date,
            display_order: exp.display_order,
          })
          .select()
          .single();

        if (expError || !newExp) {
          console.error('Error cloning experience:', expError);
          continue;
        }

        // Clone bullets for this experience
        if (exp.bullets && exp.bullets.length > 0) {
          const bulletsToInsert = exp.bullets.map((bullet: any) => ({
            experience_id: newExp.id,
            content: bullet.content,
            is_selected: bullet.is_selected,
            display_order: bullet.display_order,
            score: bullet.score,
            tags: bullet.tags,
          }));

          const { error: bulletsError } = await supabase
            .from('resume_experience_bullets')
            .insert(bulletsToInsert);

          if (bulletsError) {
            console.error('Error cloning bullets:', bulletsError);
          }
        }
      }
    }

    // Clone education with achievements
    if (education && education.length > 0) {
      for (const edu of education) {
        const { data: newEdu, error: eduError } = await supabase
          .from('resume_education')
          .insert({
            version_id: newVersion.id,
            school: edu.school,
            degree: edu.degree,
            field: edu.field,
            location: edu.location,
            start_date: edu.start_date,
            end_date: edu.end_date,
            gpa: edu.gpa,
            display_order: edu.display_order,
          })
          .select()
          .single();

        if (eduError || !newEdu) {
          console.error('Error cloning education:', eduError);
          continue;
        }

        // Clone achievements for this education
        if (edu.achievements && edu.achievements.length > 0) {
          const achievementsToInsert = edu.achievements.map((achievement: any) => ({
            education_id: newEdu.id,
            achievement: achievement.achievement,
            display_order: achievement.display_order,
          }));

          const { error: achievementsError } = await supabase
            .from('resume_education_achievements')
            .insert(achievementsToInsert);

          if (achievementsError) {
            console.error('Error cloning achievements:', achievementsError);
          }
        }
      }
    }

    // Clone skills
    if (skills && skills.length > 0) {
      const skillsToInsert = skills.map(skill => ({
        version_id: newVersion.id,
        category: skill.category,
        skill_name: skill.skill_name,
        display_order: skill.display_order,
      }));

      const { error: skillsError } = await supabase
        .from('resume_skills')
        .insert(skillsToInsert);

      if (skillsError) {
        console.error('Error cloning skills:', skillsError);
      }
    }

    // Clone styles
    if (styles) {
      const { error: stylesError } = await supabase
        .from('resume_styles')
        .insert({
          version_id: newVersion.id,
          font_family: styles.font_family,
          font_size: styles.font_size,
          line_height: styles.line_height,
          margin_top: styles.margin_top,
          margin_bottom: styles.margin_bottom,
          margin_left: styles.margin_left,
          margin_right: styles.margin_right,
          accent_color: styles.accent_color,
          heading_color: styles.heading_color,
          text_color: styles.text_color,
        });

      if (stylesError) {
        console.error('Error cloning styles:', stylesError);
      }
    } else {
      // Create default styles if source had none
      const { error: defaultStylesError } = await supabase
        .from('resume_styles')
        .insert({
          version_id: newVersion.id,
        });

      if (defaultStylesError) {
        console.error('Error creating default styles:', defaultStylesError);
      }
    }

    return NextResponse.json(
      { version: newVersion },
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
