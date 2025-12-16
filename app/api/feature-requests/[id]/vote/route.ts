import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/feature-requests/[id]/vote - Add or update vote on feature request
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

    // Parse request body for vote_type
    const body = await request.json();
    const { vote_type } = body;

    // Validate vote_type
    if (!vote_type || !['upvote', 'downvote'].includes(vote_type)) {
      return NextResponse.json(
        { error: 'Invalid vote_type. Must be upvote or downvote' },
        { status: 400 }
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
      .select('id, vote_type')
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
      // If same vote type, do nothing (or you could return current state)
      if (existingVote.vote_type === vote_type) {
        // Get current vote counts
        const voteCounts = await getVoteCounts(supabase, featureRequestId);
        return NextResponse.json({
          success: true,
          ...voteCounts,
          user_vote_type: vote_type,
          message: 'Vote unchanged',
        });
      }

      // Update existing vote to new type
      const { error: updateError } = await supabase
        .from('feature_request_votes')
        .update({ vote_type })
        .eq('id', existingVote.id);

      if (updateError) {
        console.error('Error updating vote:', updateError);
        return NextResponse.json(
          { error: 'Failed to update vote' },
          { status: 500 }
        );
      }
    } else {
      // Insert new vote
      const { error: insertError } = await supabase
        .from('feature_request_votes')
        .insert({
          feature_request_id: featureRequestId,
          user_id: user.id,
          vote_type,
        });

      if (insertError) {
        console.error('Error adding vote:', insertError);
        return NextResponse.json(
          { error: 'Failed to add vote' },
          { status: 500 }
        );
      }
    }

    // Get updated vote counts
    const voteCounts = await getVoteCounts(supabase, featureRequestId);

    return NextResponse.json({
      success: true,
      ...voteCounts,
      user_vote_type: vote_type,
      message: existingVote ? 'Vote updated successfully' : 'Vote added successfully',
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

    // Get updated vote counts
    const voteCounts = await getVoteCounts(supabase, featureRequestId);

    return NextResponse.json({
      success: true,
      ...voteCounts,
      user_vote_type: null,
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

// Helper function to get vote counts
async function getVoteCounts(supabase: Awaited<ReturnType<typeof createClient>>, featureRequestId: string) {
  const { data: votes } = await supabase
    .from('feature_request_votes')
    .select('vote_type')
    .eq('feature_request_id', featureRequestId);

  let upvotes = 0;
  let downvotes = 0;

  votes?.forEach(vote => {
    if (vote.vote_type === 'upvote') {
      upvotes += 1;
    } else if (vote.vote_type === 'downvote') {
      downvotes += 1;
    }
  });

  return {
    vote_count: upvotes - downvotes,
    upvote_count: upvotes,
    downvote_count: downvotes,
  };
}
