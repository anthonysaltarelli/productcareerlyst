import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to get admin user IDs from environment variable
// Supports comma-separated list: ADMIN_USER_IDS=uuid1,uuid2,uuid3
const getAdminUserIds = (): string[] => {
  const adminIds = process.env.ADMIN_USER_IDS || process.env.ADMIN_USER_ID || '';
  return adminIds.split(',').map(id => id.trim()).filter(Boolean);
};

// PATCH /api/feature-requests/[id] - Update feature request (admin: status, archive)
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminUserIds = getAdminUserIds();
    const isAdmin = adminUserIds.includes(user.id);
    
    // Get the feature request to check ownership
    const { data: featureRequest, error: fetchError } = await supabase
      .from('feature_requests')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !featureRequest) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status, is_archived, title, description } = body;

    const isOwner = featureRequest.user_id === user.id;

    // Validate permissions for status/archive - only admins can update these
    if ((status !== undefined || is_archived !== undefined) && !isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can update status or archive feature requests' },
        { status: 403 }
      );
    }

    // Validate permissions for title/description - only owner can update these
    if ((title !== undefined || description !== undefined) && !isOwner) {
      return NextResponse.json(
        { error: 'You can only edit your own feedback' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    // Owner can update title and description
    if (isOwner) {
      if (title !== undefined) {
        if (typeof title !== 'string' || title.trim() === '') {
          return NextResponse.json(
            { error: 'Title cannot be empty' },
            { status: 400 }
          );
        }
        updateData.title = title.trim();
      }

      if (description !== undefined) {
        if (typeof description !== 'string' || description.trim() === '') {
          return NextResponse.json(
            { error: 'Description cannot be empty' },
            { status: 400 }
          );
        }
        updateData.description = description.trim();
      }
    }

    // Admin can update status
    if (isAdmin && status !== undefined) {
      // Validate status value (support both old and new status values during transition)
      const validStatuses = [null, 'under_review', 'in_progress', 'complete', 'evaluating', 'shipped', 'archived'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Admin can update archive status
    if (isAdmin && is_archived !== undefined) {
      if (typeof is_archived !== 'boolean') {
        return NextResponse.json(
          { error: 'is_archived must be a boolean' },
          { status: 400 }
        );
      }
      updateData.is_archived = is_archived;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the feature request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('feature_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating feature request:', updateError);
      return NextResponse.json(
        { error: `Failed to update feature request: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feature_request: updatedRequest,
    });
  } catch (error) {
    console.error('Unexpected error updating feature request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// DELETE /api/feature-requests/[id] - Delete feature request (owner only)
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the feature request to check ownership
    const { data: featureRequest, error: fetchError } = await supabase
      .from('feature_requests')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !featureRequest) {
      return NextResponse.json(
        { error: 'Feature request not found' },
        { status: 404 }
      );
    }

    const isOwner = featureRequest.user_id === user.id;
    const adminUserIds = getAdminUserIds();
    const isAdmin = adminUserIds.includes(user.id);

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only delete your own feature requests' },
        { status: 403 }
      );
    }

    // Delete the feature request (votes will cascade delete)
    const { error: deleteError } = await supabase
      .from('feature_requests')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting feature request:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete feature request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feature request deleted successfully',
    });
  } catch (error) {
    console.error('Unexpected error deleting feature request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

