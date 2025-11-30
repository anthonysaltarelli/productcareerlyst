import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { markBaselineActionsComplete } from '@/lib/utils/baseline-actions';
import { incrementWeeklyGoalProgress } from '@/lib/utils/weekly-goals';

// GET /api/jobs/applications - Get all job applications for current user
export const GET = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = supabase
      .from('job_applications')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ applications: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

// POST /api/jobs/applications - Create a new job application
export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.company_id || !body.title) {
      return NextResponse.json(
        { error: 'Company ID and job title are required' },
        { status: 400 }
      );
    }

    // Create application
    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        user_id: user.id,
        company_id: body.company_id,
        title: body.title,
        location: body.location,
        work_mode: body.work_mode,
        salary_min: body.salary_min,
        salary_max: body.salary_max,
        salary_currency: body.salary_currency || 'USD',
        job_url: body.job_url,
        description: body.description,
        status: body.status || 'wishlist',
        priority: body.priority || 'medium',
        applied_date: body.applied_date,
        deadline: body.deadline,
        notes: body.notes,
      })
      .select(`
        *,
        company:companies(*)
      `)
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      );
    }

    // Mark baseline action complete for adding a job
    markBaselineActionsComplete(user.id, 'job_added').catch((err) => {
      console.error('Error marking job_added baseline action:', err);
    });

    // If the status is 'applied', increment weekly goal
    if (data.status === 'applied') {
      incrementWeeklyGoalProgress(user.id, 'job_applied').catch((err) => {
        console.error('Error incrementing job_applied weekly goal:', err);
      });

      // Also mark application tracking baseline action
      markBaselineActionsComplete(user.id, 'application_tracked').catch((err) => {
        console.error('Error marking application_tracked baseline action:', err);
      });
    }

    return NextResponse.json(
      { application: data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

