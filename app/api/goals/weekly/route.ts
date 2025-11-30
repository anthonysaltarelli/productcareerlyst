import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  incrementWeeklyGoalProgress,
  getWeeklyGoalProgress,
  WEEKLY_GOAL_TRIGGERS,
  type WeeklyGoalTrigger,
} from '@/lib/utils/weekly-goals';

interface IncrementWeeklyGoalRequest {
  trigger: string;
  increment_by?: number;
}

/**
 * POST /api/goals/weekly
 * Increment weekly goal progress based on a trigger event
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as IncrementWeeklyGoalRequest;
    const { trigger, increment_by = 1 } = body;

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger is required' }, { status: 400 });
    }

    // Validate trigger is a known type
    if (!(trigger in WEEKLY_GOAL_TRIGGERS)) {
      return NextResponse.json(
        { error: `Unknown trigger: ${trigger}` },
        { status: 400 }
      );
    }

    const result = await incrementWeeklyGoalProgress(
      user.id,
      trigger as WeeklyGoalTrigger,
      increment_by
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update weekly goals' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      goalsUpdated: result.goalsUpdated,
    });
  } catch (error) {
    console.error('Error in weekly goals POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/goals/weekly
 * Get weekly goal progress for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getWeeklyGoalProgress(user.id);

    if (!result) {
      return NextResponse.json({ error: 'Failed to fetch weekly goals' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in weekly goals GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
