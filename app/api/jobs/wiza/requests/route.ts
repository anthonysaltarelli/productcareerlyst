import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/jobs/wiza/requests?application_id=<id>
 * 
 * Get all Wiza requests for a job application
 */
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
    const applicationId = searchParams.get('application_id');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'application_id query parameter is required' },
        { status: 400 }
      );
    }

    // Get all Wiza requests for this application
    const { data: requests, error } = await supabase
      .from('wiza_requests')
      .select('*')
      .eq('application_id', applicationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching Wiza requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch Wiza requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      requests: requests || [],
    });
  } catch (error) {
    console.error('Error fetching Wiza requests:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch Wiza requests' 
      },
      { status: 500 }
    );
  }
};

