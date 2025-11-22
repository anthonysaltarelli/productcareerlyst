import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { ideaId } = await params;

    const { data: rating, error: ratingError } = await supabase
      .from('portfolio_idea_ratings')
      .select('*')
      .eq('idea_id', ideaId)
      .eq('user_id', user.id)
      .single();

    if (ratingError && ratingError.code !== 'PGRST116') {
      console.error('Error fetching rating:', ratingError);
      return NextResponse.json(
        { error: 'Failed to fetch rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rating: rating || null });
  } catch (error) {
    console.error('Error in get rating endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { ideaId } = await params;
    const body = await request.json();
    const { rating, feedback } = body;

    if (!rating || !['up', 'down'].includes(rating)) {
      return NextResponse.json(
        { error: 'Rating must be "up" or "down"' },
        { status: 400 }
      );
    }

    if (rating === 'down' && (!feedback || feedback.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Feedback is required for thumbs down' },
        { status: 400 }
      );
    }

    // Verify the idea belongs to the user
    const { data: idea, error: ideaError } = await supabase
      .from('portfolio_ideas')
      .select(`
        id,
        portfolio_idea_requests!inner(user_id)
      `)
      .eq('id', ideaId)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    // Upsert the rating (insert or update)
    const { data: ratingData, error: ratingError } = await supabase
      .from('portfolio_idea_ratings')
      .upsert({
        idea_id: ideaId,
        user_id: user.id,
        rating,
        feedback: rating === 'down' ? feedback : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'idea_id,user_id',
      })
      .select()
      .single();

    if (ratingError) {
      console.error('Error saving rating:', ratingError);
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, rating: ratingData });
  } catch (error) {
    console.error('Error in rate endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { ideaId } = await params;

    const { error: deleteError } = await supabase
      .from('portfolio_idea_ratings')
      .delete()
      .eq('idea_id', ideaId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting rating:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete rating endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

