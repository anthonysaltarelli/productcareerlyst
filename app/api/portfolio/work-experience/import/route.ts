import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/portfolio/work-experience/import
 * Get available resume versions with their work experience for import
 * 
 * Query params:
 *   - versionId: Optional specific version ID to fetch experiences from
 */
export const GET = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const versionId = searchParams.get('versionId');

    // If a specific version ID is provided, fetch experiences from that version
    if (versionId) {
      // Verify the version belongs to the user
      const { data: version, error: versionError } = await supabase
        .from('resume_versions')
        .select('id, name, is_master')
        .eq('id', versionId)
        .eq('user_id', user.id)
        .single();

      if (versionError || !version) {
        return NextResponse.json(
          { error: 'Resume version not found' },
          { status: 404 }
        );
      }

      // Fetch experiences from this version
      const { data: experiences, error: expError } = await supabase
        .from('resume_experiences')
        .select('id, title, company, start_date, end_date, display_order')
        .eq('version_id', versionId)
        .order('display_order', { ascending: true });

      if (expError) {
        console.error('Error fetching experiences:', expError);
        return NextResponse.json(
          { error: 'Failed to fetch experiences' },
          { status: 500 }
        );
      }

      // Transform to portfolio work experience format
      const workExperience = (experiences || []).map((exp, index) => ({
        company: exp.company,
        title: exp.title,
        is_current: !exp.end_date || exp.end_date.toLowerCase() === 'present',
        display_order: index,
      }));

      return NextResponse.json({
        version,
        workExperience,
      });
    }

    // Otherwise, return all resume versions for selection
    const { data: versions, error: versionsError } = await supabase
      .from('resume_versions')
      .select('id, name, is_master, created_at, updated_at')
      .eq('user_id', user.id)
      .order('is_master', { ascending: false })
      .order('updated_at', { ascending: false });

    if (versionsError) {
      console.error('Error fetching resume versions:', versionsError);
      return NextResponse.json(
        { error: 'Failed to fetch resume versions' },
        { status: 500 }
      );
    }

    // For each version, get a count of experiences
    const versionsWithCounts = await Promise.all(
      (versions || []).map(async (version) => {
        const { count } = await supabase
          .from('resume_experiences')
          .select('id', { count: 'exact', head: true })
          .eq('version_id', version.id);

        return {
          ...version,
          experience_count: count || 0,
        };
      })
    );

    return NextResponse.json({
      versions: versionsWithCounts,
    });
  } catch (error) {
    console.error('Error in GET /api/portfolio/work-experience/import:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};





