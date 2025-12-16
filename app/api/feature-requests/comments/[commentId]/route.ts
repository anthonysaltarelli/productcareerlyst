import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/feature-requests/comments/[commentId] - Edit own comment
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { commentId } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the comment to check ownership
    const { data: comment, error: fetchError } = await supabase
      .from('feature_request_comments')
      .select('id, user_id, feature_request_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Check if the feature request is archived
    const { data: featureRequest } = await supabase
      .from('feature_requests')
      .select('is_archived')
      .eq('id', comment.feature_request_id)
      .single();

    if (featureRequest?.is_archived) {
      return NextResponse.json(
        { error: 'Cannot edit comments on archived feature requests' },
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

    // Update the comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('feature_request_comments')
      .update({ content: content.trim() })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating comment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      );
    }

    // Get user's profile for author info
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      comment: {
        ...updatedComment,
        author: profile || { first_name: null, last_name: null },
        is_own_comment: true,
      },
      message: 'Comment updated successfully',
    });
  } catch (error) {
    console.error('Unexpected error updating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// DELETE /api/feature-requests/comments/[commentId] - Delete own comment
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { commentId } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the comment to check ownership
    const { data: comment, error: fetchError } = await supabase
      .from('feature_request_comments')
      .select('id, user_id, feature_request_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check ownership (admins could also delete if needed)
    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('feature_request_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Unexpected error deleting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
