import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/portfolio/requests - Get all previous portfolio idea requests for the user
export const GET = async (request: NextRequest) => {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all requests for the user with their ideas
    const { data: requests, error: requestsError } = await supabase
      .from('portfolio_idea_requests')
      .select(`
        id,
        input_text,
        created_at,
        updated_at,
        portfolio_ideas (
          id,
          idea_number,
          company_name,
          problem_description,
          hypothesis,
          user_segment,
          portfolio_idea_favorites!left(id)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }

    // Get all idea IDs to fetch favorites and ratings
    const allIdeaIds = (requests || []).flatMap((request: any) => 
      (request.portfolio_ideas || []).map((idea: any) => idea.id)
    );

    // Fetch favorites for all ideas
    const { data: favorites } = await supabase
      .from('portfolio_idea_favorites')
      .select('idea_id')
      .eq('user_id', user.id)
      .in('idea_id', allIdeaIds);

    const favoritedIdeaIds = new Set((favorites || []).map((f: any) => f.idea_id));

    // Transform the data to match the expected format
    const formattedRequests = (requests || []).map((request: any) => ({
      id: request.id,
      input_text: request.input_text,
      created_at: request.created_at,
      updated_at: request.updated_at,
      ideas: (request.portfolio_ideas || []).map((idea: any) => ({
        id: idea.id,
        idea_number: idea.idea_number,
        company_name: idea.company_name,
        problem_description: idea.problem_description,
        hypothesis: idea.hypothesis,
        user_segment: idea.user_segment,
        is_favorited: favoritedIdeaIds.has(idea.id),
      })),
    }));

    return NextResponse.json({
      requests: formattedRequests,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

