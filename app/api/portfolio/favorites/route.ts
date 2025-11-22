import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all favorited ideas with their full details
    const { data: favorites, error: favoritesError } = await supabase
      .from('portfolio_idea_favorites')
      .select(`
        id,
        created_at,
        portfolio_ideas (
          id,
          idea_number,
          company_name,
          problem_description,
          hypothesis,
          user_segment,
          created_at,
          portfolio_idea_requests!inner (
            id,
            input_text,
            created_at
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError);
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const ideas = (favorites || [])
      .filter((fav: any) => fav.portfolio_ideas !== null)
      .map((fav: any) => {
        const idea = fav.portfolio_ideas;
        return {
          id: idea.id,
          idea_number: idea.idea_number,
          company_name: idea.company_name,
          problem_description: idea.problem_description,
          hypothesis: idea.hypothesis,
          user_segment: idea.user_segment,
          created_at: idea.created_at,
          favorited_at: fav.created_at,
          is_favorited: true,
        };
      });

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error('Error in favorites endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

