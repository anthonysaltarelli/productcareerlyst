import { createClient } from '@/lib/supabase/server';
import type { UserPlanData } from '@/app/api/dashboard/plan/route';

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

/**
 * Fetch user's plan data for dashboard display
 */
export async function getUserPlanData(userId: string): Promise<UserPlanData | null> {
  try {
    const supabase = await createClient();

    // Fetch user plan
    const { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (planError) {
      console.error('Error fetching user plan:', planError);
      return null;
    }

    // If no plan, return null
    if (!userPlan) {
      return null;
    }

    // Fetch baseline actions
    const { data: baselineActions, error: baselineError } = await supabase
      .from('user_baseline_actions')
      .select('id, action_id, label, section_title, is_completed')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (baselineError) {
      console.error('Error fetching baseline actions:', baselineError);
    }

    // Fetch weekly goals
    const { data: weeklyGoals, error: goalsError } = await supabase
      .from('user_weekly_goals')
      .select('id, goal_id, label, target_count, is_enabled')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (goalsError) {
      console.error('Error fetching weekly goals:', goalsError);
    }

    // Fetch weekly progress for current week
    const weekStart = getWeekStart();
    const { data: weeklyProgress, error: progressError } = await supabase
      .from('user_weekly_progress')
      .select('goal_id, current_count, target_count')
      .eq('user_id', userId)
      .eq('week_start', weekStart);

    if (progressError) {
      console.error('Error fetching weekly progress:', progressError);
    }

    // Build response
    const planData: UserPlanData = {
      summary: userPlan.summary,
      targetRole: userPlan.target_role,
      targetDate: userPlan.target_date,
      timeline: userPlan.timeline_selection,
      weeklyGoalsDescription: userPlan.weekly_goals_description,
      baselineActions: (baselineActions || []).map((action) => ({
        id: action.id,
        actionId: action.action_id,
        label: action.label,
        sectionTitle: action.section_title,
        isCompleted: action.is_completed,
      })),
      baselineAllComplete: userPlan.baseline_all_complete,
      weeklyGoals: (weeklyGoals || []).map((goal) => ({
        id: goal.id,
        goalId: goal.goal_id,
        label: goal.label,
        targetCount: goal.target_count,
        isEnabled: goal.is_enabled,
      })),
      weeklyProgress: (weeklyProgress || []).map((progress) => ({
        goalId: progress.goal_id,
        currentCount: progress.current_count,
        targetCount: progress.target_count,
      })),
      hasPlan: true,
    };

    return planData;
  } catch (error) {
    console.error('Error in getUserPlanData:', error);
    return null;
  }
}
