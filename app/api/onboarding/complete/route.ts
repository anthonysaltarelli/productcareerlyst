import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PersonalizedPlan } from '@/lib/utils/planGenerator';
import { calculateTargetDate } from '@/lib/utils/planGenerator';

interface CompleteOnboardingRequest {
  plan: PersonalizedPlan;
  confirmedGoals: Array<{
    id: string;
    label: string;
    target: number | null;
  }>;
}

// Get the Monday of the current week
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  // If Sunday (0), go back 6 days. Otherwise, go back (day - 1) days
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0]; // YYYY-MM-DD format
}

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

    const body = (await request.json()) as CompleteOnboardingRequest;
    const { plan, confirmedGoals } = body;

    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
    }

    // Get onboarding progress for user data
    const { data: onboardingProgress } = await supabase
      .from('onboarding_progress')
      .select('progress_data')
      .eq('user_id', user.id)
      .single();

    const progressData = onboardingProgress?.progress_data;
    const personalInfo = progressData?.personal_info;
    const goalsData = progressData?.goals;

    // 1. Update user profile with first_name and last_name
    if (personalInfo?.firstName || personalInfo?.lastName) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            first_name: personalInfo.firstName || null,
            last_name: personalInfo.lastName || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (profileError) {
        console.error('Error updating profile:', profileError);
        // Don't fail the whole request for profile update issues
      }
    }

    // 2. Calculate target date from timeline
    const timeline = goalsData?.timeline || '3_months';
    const targetDate = calculateTargetDate(timeline);

    // 3. Save plan to user_plans table
    const { error: planError } = await supabase.from('user_plans').upsert(
      {
        user_id: user.id,
        plan_version: 1,
        onboarding_snapshot: progressData || {},
        summary: plan.summary,
        baseline_actions: plan.baselineActions,
        weekly_goals_description: plan.weeklyGoals.description,
        target_role: goalsData?.targetRole || null,
        target_date: targetDate.toISOString().split('T')[0], // YYYY-MM-DD
        timeline_selection: timeline,
        baseline_all_complete: false,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    if (planError) {
      console.error('Error saving user plan:', planError);
      return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });
    }

    // 4. Save baseline actions to user_baseline_actions table
    const baselineActionsToInsert: Array<{
      user_id: string;
      action_id: string;
      label: string;
      section_title: string;
      is_completed: boolean;
    }> = [];

    for (const section of plan.baselineActions) {
      for (const action of section.actions) {
        baselineActionsToInsert.push({
          user_id: user.id,
          action_id: action.id,
          label: action.label,
          section_title: section.title,
          is_completed: false,
        });
      }
    }

    if (baselineActionsToInsert.length > 0) {
      // Delete existing baseline actions for this user (to handle re-onboarding)
      await supabase.from('user_baseline_actions').delete().eq('user_id', user.id);

      const { error: baselineError } = await supabase
        .from('user_baseline_actions')
        .insert(baselineActionsToInsert);

      if (baselineError) {
        console.error('Error saving baseline actions:', baselineError);
        // Continue - baseline actions are not critical for completion
      }
    }

    // 5. Save weekly goals to user_weekly_goals table
    if (confirmedGoals && confirmedGoals.length > 0) {
      // Delete existing weekly goals for this user (to handle re-onboarding)
      await supabase.from('user_weekly_goals').delete().eq('user_id', user.id);

      const weeklyGoalsToInsert = confirmedGoals.map((goal) => ({
        user_id: user.id,
        goal_id: goal.id,
        label: goal.label,
        target_count: goal.target || 0,
        is_enabled: true,
      }));

      const { error: goalsError } = await supabase
        .from('user_weekly_goals')
        .insert(weeklyGoalsToInsert);

      if (goalsError) {
        console.error('Error saving weekly goals:', goalsError);
        // Continue - weekly goals are not critical for completion
      }

      // 6. Create initial weekly progress rows for the current week
      const weekStart = getWeekStart();

      // Delete existing progress for this week (to handle re-onboarding)
      await supabase
        .from('user_weekly_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('week_start', weekStart);

      const weeklyProgressToInsert = confirmedGoals.map((goal) => ({
        user_id: user.id,
        goal_id: goal.id,
        week_start: weekStart,
        current_count: 0,
        target_count: goal.target || 0,
      }));

      const { error: progressError } = await supabase
        .from('user_weekly_progress')
        .insert(weeklyProgressToInsert);

      if (progressError) {
        console.error('Error creating weekly progress:', progressError);
        // Continue - progress will be created lazily if needed
      }
    }

    // 7. Log goal_event for plan creation
    await supabase.from('goal_events').insert({
      user_id: user.id,
      event_type: 'plan_created',
      goal_id: 'onboarding',
      metadata: {
        plan_version: 1,
        baseline_action_count: baselineActionsToInsert.length,
        weekly_goal_count: confirmedGoals?.length || 0,
        target_role: goalsData?.targetRole,
        timeline: timeline,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
