import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/feature-requests/[id]/comments - List all comments for a feature request
export const GET = async (
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

    // Check if feature request exists
    const { data: featureRequest, error: fetchError } = await supabase
      .from('feature_requests')
      .select('id')
      .eq('id', featureRequestId)
      .single();

    if (fetchError || !featureRequest) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Get all comments for this feature request
    const { data: comments, error: commentsError } = await supabase
      .from('feature_request_comments')
      .select('id, feature_request_id, user_id, content, created_at, updated_at')
      .eq('feature_request_id', featureRequestId)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Get profiles for comment authors
    const userIds = [...new Set(comments?.map(c => c.user_id) || [])];

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Build profile map
    const profileMap = new Map(
      profiles?.map(p => [p.user_id, { first_name: p.first_name, last_name: p.last_name }]) || []
    );

    // Enrich comments with author info
    const enrichedComments = comments?.map(comment => ({
      ...comment,
      author: profileMap.get(comment.user_id) || { first_name: null, last_name: null },
      is_own_comment: comment.user_id === user.id,
    })) || [];

    return NextResponse.json({
      success: true,
      comments: enrichedComments,
    });
  } catch (error) {
    console.error('Unexpected error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// POST /api/feature-requests/[id]/comments - Add a new comment
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
        { error: 'Cannot comment on archived feature requests' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { content } = body;

    // Validate content
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (content.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Comment cannot exceed 2000 characters' },
        { status: 400 }
      );
    }

    // Get user's profile for author info
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle();

    // Insert new comment
    const { data: newComment, error: insertError } = await supabase
      .from('feature_request_comments')
      .insert({
        feature_request_id: featureRequestId,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding comment:', insertError);
      return NextResponse.json(
        { error: 'Failed to add comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comment: {
        ...newComment,
        author: profile || { first_name: null, last_name: null },
        is_own_comment: true,
      },
      message: 'Comment added successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error adding comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
