import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  markBaselineActionsComplete,
  BASELINE_TRIGGERS,
  type BaselineTrigger,
} from '@/lib/utils/baseline-actions';

interface CompleteBaselineRequest {
  trigger: string;
}

/**
 * POST /api/goals/baseline
 * Mark baseline actions as complete based on a trigger event
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

    const body = (await request.json()) as CompleteBaselineRequest;
    const { trigger } = body;

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger is required' }, { status: 400 });
    }

    // Validate trigger is a known type
    if (!(trigger in BASELINE_TRIGGERS)) {
      return NextResponse.json(
        { error: `Unknown trigger: ${trigger}` },
        { status: 400 }
      );
    }

    const result = await markBaselineActionsComplete(user.id, trigger as BaselineTrigger);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update baseline actions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      actionsCompleted: result.actionsCompleted,
    });
  } catch (error) {
    console.error('Error in baseline complete API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface ToggleBaselineRequest {
  actionId: string;
  isCompleted: boolean;
}

/**
 * PATCH /api/goals/baseline
 * Manually toggle a baseline action's completion status
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as ToggleBaselineRequest;
    const { actionId, isCompleted } = body;

    if (!actionId || typeof isCompleted !== 'boolean') {
      return NextResponse.json(
        { error: 'actionId and isCompleted are required' },
        { status: 400 }
      );
    }

    // Update the specific baseline action
    const { data: updatedAction, error: updateError } = await supabase
      .from('user_baseline_actions')
      .update({ is_completed: isCompleted })
      .eq('user_id', user.id)
      .eq('action_id', actionId)
      .select('id, action_id, label, is_completed')
      .single();

    if (updateError) {
      console.error('Error updating baseline action:', updateError);
      return NextResponse.json(
        { error: 'Failed to update baseline action' },
        { status: 500 }
      );
    }

    // Check if all baseline actions are now complete and update user_plans
    const { count: incompleteCount } = await supabase
      .from('user_baseline_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_completed', false);

    const allComplete = incompleteCount === 0;

    // Update user_plans baseline_all_complete status
    await supabase
      .from('user_plans')
      .update({
        baseline_all_complete: allComplete,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    // Log the manual toggle event
    await supabase.from('goal_events').insert({
      user_id: user.id,
      event_type: 'baseline_action_manual_toggle',
      goal_id: actionId,
      metadata: {
        action_id: actionId,
        is_completed: isCompleted,
        manual: true,
      },
    });

    return NextResponse.json({
      success: true,
      action: updatedAction,
      allComplete,
    });
  } catch (error) {
    console.error('Error in baseline PATCH API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/goals/baseline
 * Get all baseline actions and their completion status for the current user
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

    // Fetch all baseline actions for the user
    const { data: actions, error } = await supabase
      .from('user_baseline_actions')
      .select('action_id, label, section_title, is_completed')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching baseline actions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch baseline actions' },
        { status: 500 }
      );
    }

    // Get overall completion status
    const { data: plan } = await supabase
      .from('user_plans')
      .select('baseline_all_complete')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      actions: actions || [],
      allComplete: plan?.baseline_all_complete || false,
      totalActions: actions?.length || 0,
      completedActions: actions?.filter((a) => a.is_completed).length || 0,
    });
  } catch (error) {
    console.error('Error in baseline GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
