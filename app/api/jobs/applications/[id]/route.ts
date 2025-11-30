import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { markBaselineActionsComplete } from '@/lib/utils/baseline-actions';
import { incrementWeeklyGoalProgress } from '@/lib/utils/weekly-goals';

// GET /api/jobs/applications/[id] - Get a specific application
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching application:', error);
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ application: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// PATCH /api/jobs/applications/[id] - Update an application
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Update application (RLS ensures user can only update their own)
    const { data, error } = await supabase
      .from('job_applications')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        company:companies(*)
      `)
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      );
    }

    // If status was changed to 'applied', increment weekly goal and mark baseline action
    if (body.status === 'applied') {
      incrementWeeklyGoalProgress(user.id, 'job_applied').catch((err) => {
        console.error('Error incrementing job_applied weekly goal:', err);
      });

      markBaselineActionsComplete(user.id, 'application_tracked').catch((err) => {
        console.error('Error marking application_tracked baseline action:', err);
      });
    }

    // If status was changed to 'wishlist', mark target companies baseline action
    if (body.status === 'wishlist') {
      markBaselineActionsComplete(user.id, 'target_companies_added').catch((err) => {
        console.error('Error marking target_companies_added baseline action:', err);
      });
    }

    return NextResponse.json({ application: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// DELETE /api/jobs/applications/[id] - Delete an application
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting application:', error);
      return NextResponse.json(
        { error: 'Failed to delete application' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Application deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

