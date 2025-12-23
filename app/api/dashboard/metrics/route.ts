import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDashboardMetrics, type DashboardMetrics } from '@/lib/utils/dashboard-metrics';
import type { TimeRange } from '@/app/components/dashboard/TimeRangeSelector';

export type { DashboardMetrics };

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

    // Get time range from query params (default to 30d)
    const searchParams = request.nextUrl.searchParams;
    const timeRange = (searchParams.get('range') || '30d') as TimeRange;

    // Validate time range
    const validRanges: TimeRange[] = ['7d', '30d', '90d', 'all'];
    if (!validRanges.includes(timeRange)) {
      return NextResponse.json(
        { error: 'Invalid time range. Must be one of: 7d, 30d, 90d, all' },
        { status: 400 }
      );
    }

    const metrics = await getDashboardMetrics(user.id, timeRange);

    if (!metrics) {
      return NextResponse.json(
        { error: 'Failed to fetch dashboard metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
};
