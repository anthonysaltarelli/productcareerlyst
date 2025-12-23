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

    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
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

    // If user is authenticated, we can check for existing rating and update
    // If user is not authenticated but has userIdParam, we'll try to insert (RLS will handle uniqueness)
    if (userId && user?.id) {
      // Authenticated user - check if rating exists and update or insert
      const { data: existingRating, error: checkError } = await supabase
        .from('nps_ratings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      // Log check errors but don't fail - we'll try insert/update anyway
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing rating (non-fatal):', {
          code: checkError.code,
          message: checkError.message,
          userId,
          isAuthenticated: !!user,
        });
        // Continue to try insert - if it exists, we'll get a unique constraint error
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
        // Insert new rating - use function to ensure it works
        const { data: functionResult, error: functionError } = await supabase.rpc('insert_nps_rating', {
          p_user_id: userId,
          p_rating: ratingNum,
          p_feedback: feedback || null,
          p_source: source || null,
        });
        
        if (functionError) {
          ratingError = functionError;
        } else if (functionResult && functionResult.length > 0) {
          ratingData = functionResult[0];
          ratingError = null;
        } else {
          ratingError = { code: 'UNKNOWN', message: 'Function returned no data' };
        }
      }
    } else if (userId && !user?.id) {
      // Unauthenticated user with userIdParam - use function to bypass RLS
      const { data: functionResult, error: functionError } = await supabase.rpc('insert_nps_rating', {
        p_user_id: userId,
        p_rating: ratingNum,
        p_feedback: feedback || null,
        p_source: source || null,
      });
      
      if (functionError) {
        ratingError = functionError;
      } else if (functionResult && functionResult.length > 0) {
        ratingData = functionResult[0];
        ratingError = null;
      } else {
        // Function returned no rows (shouldn't happen, but handle it)
        ratingError = { code: 'UNKNOWN', message: 'Function returned no data' };
      }
    } else {
      // No user_id - insert new rating for unauthenticated users
      // Use function for consistency
      const { data: functionResult, error: functionError } = await supabase.rpc('insert_nps_rating', {
        p_user_id: null,
        p_rating: ratingNum,
        p_feedback: feedback || null,
        p_source: source || null,
      });
      
      if (functionError) {
        ratingError = functionError;
      } else if (functionResult && functionResult.length > 0) {
        ratingData = functionResult[0];
        ratingError = null;
      } else {
        ratingError = { code: 'UNKNOWN', message: 'Function returned no data' };
      }
    }

    if (ratingError) {
      console.error('Error saving rating:', {
        code: ratingError.code,
        message: ratingError.message,
        details: ratingError.details,
        userId,
        isAuthenticated: !!user,
      });
      return NextResponse.json(
        { error: 'Unable to save your rating. Please try again.' },
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

