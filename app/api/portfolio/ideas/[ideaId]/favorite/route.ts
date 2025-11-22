import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

    // Insert the favorite
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('portfolio_idea_favorites')
      .insert({
        idea_id: ideaId,
        user_id: user.id,
      })
      .select()
      .single();

    if (favoriteError) {
      // If it's a unique constraint error, the favorite already exists
      if (favoriteError.code === '23505') {
        return NextResponse.json({ success: true, favorite: { id: 'exists' } });
      }
      console.error('Error saving favorite:', favoriteError);
      return NextResponse.json(
        { error: 'Failed to save favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, favorite: favoriteData });
  } catch (error) {
    console.error('Error in favorite endpoint:', error);
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
      .from('portfolio_idea_favorites')
      .delete()
      .eq('idea_id', ideaId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting favorite:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete favorite endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

