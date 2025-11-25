import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/feature-requests/[id]/vote - Add vote to feature request
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: featureRequestId } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if feature request exists and is not archived
    const { data: featureRequest, error: fetchError } = await supabase
      .from('feature_requests')
      .select('id, is_archived')
      .eq('id', featureRequestId)
      .single();

    if (fetchError || !featureRequest) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    if (featureRequest.is_archived) {
      return NextResponse.json(
        { error: 'Cannot vote on archived feature requests' },
        { status: 400 }
      );
    }

    // Check if user already voted
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('feature_request_votes')
      .select('id')
      .eq('feature_request_id', featureRequestId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (voteCheckError) {
      console.error('Error checking existing vote:', voteCheckError);
      return NextResponse.json(
        { error: 'Failed to check vote status' },
        { status: 500 }
      );
    }

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted for this feature request' },
        { status: 400 }
      );
    }

    // Add vote
    const { error: insertError } = await supabase
      .from('feature_request_votes')
      .insert({
        feature_request_id: featureRequestId,
        user_id: user.id,
      });

    if (insertError) {
      console.error('Error adding vote:', insertError);
      return NextResponse.json(
        { error: 'Failed to add vote' },
        { status: 500 }
      );
    }

    // Get updated vote count
    const { count } = await supabase
      .from('feature_request_votes')
      .select('*', { count: 'exact', head: true })
      .eq('feature_request_id', featureRequestId);

    return NextResponse.json({
      success: true,
      vote_count: count || 0,
      user_has_voted: true,
      message: 'Vote added successfully',
    });
  } catch (error) {
    console.error('Unexpected error adding vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// DELETE /api/feature-requests/[id]/vote - Remove vote from feature request
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id: featureRequestId } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete the vote
    const { error: deleteError } = await supabase
      .from('feature_request_votes')
      .delete()
      .eq('feature_request_id', featureRequestId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error removing vote:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove vote' },
        { status: 500 }
      );
    }

    // Get updated vote count
    const { count } = await supabase
      .from('feature_request_votes')
      .select('*', { count: 'exact', head: true })
      .eq('feature_request_id', featureRequestId);

    return NextResponse.json({
      success: true,
      vote_count: count || 0,
      user_has_voted: false,
      message: 'Vote removed successfully',
    });
  } catch (error) {
    console.error('Unexpected error removing vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

