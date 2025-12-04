import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET: Retrieve the current user's rating (if authenticated)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Only return rating if user is authenticated
    if (!user) {
      return NextResponse.json({ rating: null });
    }

    const { data: rating, error: ratingError } = await supabase
      .from('nps_ratings')
      .select('*')
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
    console.error('Error in GET ratings endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create or update a rating (authentication optional)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { rating, feedback, source, user_id: userIdParam } = body;

    // Validate rating
    if (rating === undefined || rating === null) {
      return NextResponse.json(
        { error: 'Rating is required' },
        { status: 400 }
      );
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
      return NextResponse.json(
        { error: 'Rating must be a number between 0 and 10' },
        { status: 400 }
      );
    }

    // Determine user_id: use authenticated user's ID if available, otherwise use URL param
    const userId = user?.id || userIdParam || null;

    let ratingData;
    let ratingError;

    if (userId) {
      // Check if rating already exists for this user
      const { data: existingRating, error: checkError } = await supabase
        .from('nps_ratings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing rating:', checkError);
        return NextResponse.json(
          { error: 'Failed to check existing rating' },
          { status: 500 }
        );
      }

      if (existingRating) {
        // Update existing rating
        const result = await supabase
          .from('nps_ratings')
          .update({
            rating: ratingNum,
            feedback: feedback || null,
            source: source || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .select()
          .single();
        
        ratingData = result.data;
        ratingError = result.error;
      } else {
        // Insert new rating
        const result = await supabase
          .from('nps_ratings')
          .insert({
            user_id: userId,
            rating: ratingNum,
            feedback: feedback || null,
            source: source || null,
          })
          .select()
          .single();
        
        ratingData = result.data;
        ratingError = result.error;
      }
    } else {
      // Insert new rating for unauthenticated users (always insert, no conflict)
      const result = await supabase
        .from('nps_ratings')
        .insert({
          user_id: null,
          rating: ratingNum,
          feedback: feedback || null,
          source: source || null,
        })
        .select()
        .single();
      
      ratingData = result.data;
      ratingError = result.error;
    }

    if (ratingError) {
      console.error('Error saving rating:', ratingError);
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, rating: ratingData });
  } catch (error) {
    console.error('Error in POST ratings endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

