import { createClient } from '@/lib/supabase/server';

/**
 * Weekly goal trigger types
 * Maps events to the goal IDs they should increment
 */
export const WEEKLY_GOAL_TRIGGERS = {
  // Application events
  job_applied: ['weekly-applications'],

  // Email/outreach events
  outreach_email_sent: ['weekly-outreach-emails'],

  // Networking events
  networking_call_scheduled: ['weekly-networking-calls'],

  // Interview prep events
  interview_practice_completed: ['weekly-interview-practice'],
  mock_interview_completed: ['weekly-interview-practice'],
  negotiation_practice_completed: ['weekly-interview-practice'],

  // Follow-up events
  application_followed_up: ['weekly-follow-ups'],
} as const;

export type WeeklyGoalTrigger = keyof typeof WEEKLY_GOAL_TRIGGERS;

/**
 * Get the Monday of the current week
 */
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
 * Increment weekly goal progress for a user based on a trigger event
 * @param userId - The user's ID
 * @param trigger - The event trigger type
 * @param incrementBy - How much to increment (default: 1)
 * @returns Object with success status and updated counts
 */
export async function incrementWeeklyGoalProgress(
  userId: string,
  trigger: WeeklyGoalTrigger,
  incrementBy: number = 1
): Promise<{
  success: boolean;
  goalsUpdated: number;
  error?: string;
}> {
  try {
    const goalIds = WEEKLY_GOAL_TRIGGERS[trigger];
    if (!goalIds) {
      return { success: true, goalsUpdated: 0 };
    }

    const supabase = await createClient();
    const weekStart = getWeekStart();

    let goalsUpdated = 0;

    for (const goalId of goalIds) {
      // First, check if the user has this goal enabled
      const { data: userGoal, error: goalError } = await supabase
        .from('user_weekly_goals')
        .select('id, target_count, is_enabled')
        .eq('user_id', userId)
        .eq('goal_id', goalId)
        .maybeSingle();

      if (goalError) {
        console.error(`Error checking user goal ${goalId}:`, goalError);
        continue;
      }

      // Skip if user doesn't have this goal or it's disabled
      if (!userGoal || !userGoal.is_enabled) {
        continue;
      }

      // Check if we have a progress record for this week
      const { data: existingProgress, error: progressError } = await supabase
        .from('user_weekly_progress')
        .select('id, current_count, target_count')
        .eq('user_id', userId)
        .eq('goal_id', goalId)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (progressError) {
        console.error(`Error checking progress for ${goalId}:`, progressError);
        continue;
      }

      if (existingProgress) {
        // Update existing progress
        const newCount = Math.min(
          existingProgress.current_count + incrementBy,
          existingProgress.target_count
        );

        const { error: updateError } = await supabase
          .from('user_weekly_progress')
          .update({
            current_count: newCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);

        if (updateError) {
          console.error(`Error updating progress for ${goalId}:`, updateError);
          continue;
        }

        goalsUpdated++;
      } else {
        // Create new progress record for this week
        const { error: insertError } = await supabase
          .from('user_weekly_progress')
          .insert({
            user_id: userId,
            goal_id: goalId,
            week_start: weekStart,
            current_count: Math.min(incrementBy, userGoal.target_count),
            target_count: userGoal.target_count,
          });

        if (insertError) {
          console.error(`Error creating progress for ${goalId}:`, insertError);
          continue;
        }

        goalsUpdated++;
      }
    }

    // Log goal event if any goals were updated
    if (goalsUpdated > 0) {
      await supabase.from('goal_events').insert({
        user_id: userId,
        event_type: 'weekly_goal_progress',
        goal_id: trigger,
        metadata: {
          trigger,
          goal_ids: goalIds,
          increment_by: incrementBy,
          goals_updated: goalsUpdated,
          week_start: weekStart,
        },
      });
    }

    return { success: true, goalsUpdated };
  } catch (error) {
    console.error('Error in incrementWeeklyGoalProgress:', error);
    return {
      success: false,
      goalsUpdated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get weekly goal progress for a user
 */
export async function getWeeklyGoalProgress(
  userId: string
): Promise<{
  goals: Array<{
    goalId: string;
    label: string;
    targetCount: number;
    currentCount: number;
    isComplete: boolean;
  }>;
  weekStart: string;
} | null> {
  try {
    const supabase = await createClient();
    const weekStart = getWeekStart();

    // Get enabled goals for user
    const { data: userGoals, error: goalsError } = await supabase
      .from('user_weekly_goals')
      .select('goal_id, label, target_count')
      .eq('user_id', userId)
      .eq('is_enabled', true);

    if (goalsError || !userGoals) {
      console.error('Error fetching user goals:', goalsError);
      return null;
    }

    // Get progress for this week
    const { data: progress, error: progressError } = await supabase
      .from('user_weekly_progress')
      .select('goal_id, current_count, target_count')
      .eq('user_id', userId)
      .eq('week_start', weekStart);

    if (progressError) {
      console.error('Error fetching weekly progress:', progressError);
      return null;
    }

    const progressMap = new Map(progress?.map((p) => [p.goal_id, p]) || []);

    const goals = userGoals.map((goal) => {
      const weekProgress = progressMap.get(goal.goal_id);
      const currentCount = weekProgress?.current_count || 0;
      const targetCount = weekProgress?.target_count || goal.target_count;

      return {
        goalId: goal.goal_id,
        label: goal.label,
        targetCount,
        currentCount,
        isComplete: currentCount >= targetCount,
      };
    });

    return { goals, weekStart };
  } catch (error) {
    console.error('Error in getWeeklyGoalProgress:', error);
    return null;
  }
}
