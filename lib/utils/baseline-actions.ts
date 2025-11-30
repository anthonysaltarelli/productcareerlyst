import { createClient } from '@/lib/supabase/server';

/**
 * Baseline action trigger types
 * Maps events to the baseline action IDs they should complete
 */
export const BASELINE_TRIGGERS = {
  // Resume events
  resume_imported: ['resume-import'],
  resume_analyzed: ['resume-analyze'],
  resume_score_70: ['resume-score-70'],
  resume_score_80: ['resume-score-80'],
  resume_score_90: ['resume-score-90'],
  resume_exported: ['resume-export'],
  resume_cloned: ['resume-clone-tailored'],

  // Portfolio events
  portfolio_created: ['portfolio-create'],
  portfolio_profile_completed: ['portfolio-profile'],
  portfolio_idea_generated: ['portfolio-generate-ideas'],
  portfolio_first_case_added: ['portfolio-first-case'],
  portfolio_second_case_added: ['portfolio-second-case'],
  portfolio_published: ['portfolio-publish'],

  // Course events
  course_resume_linkedin_completed: ['course-resume-linkedin'],
  course_portfolio_completed: ['course-portfolio'],
  course_secure_referral_completed: ['course-secure-referral'],
  course_company_prep_completed: ['course-company-prep'],
  course_pm_interviews_completed: ['course-pm-interviews'],
  course_negotiation_completed: ['course-negotiation'],
  course_pm_fundamentals_completed: ['course-pm-fundamentals'],

  // Job search events
  job_added: ['job-add-first'],
  company_researched: ['job-research-companies'],
  application_tracked: ['job-track-applications'],

  // Networking events
  contact_added: ['networking-add-contact'],
  contacts_found: ['networking-find-contacts'],
  networking_scripts_accessed: ['networking-scripts'],

  // Interview prep events
  behavioral_prep_completed: ['interview-prep-behavioral'],
  mock_interview_completed: ['interview-practice-mock'],
  product_design_prep_completed: ['interview-prep-product-design'],
  strategy_prep_completed: ['interview-prep-strategy'],
  metrics_prep_completed: ['interview-prep-metrics'],
  questions_generated: ['interview-generate-questions'],
  thank_you_sent: ['interview-send-thank-you'],

  // Resource events
  resume_guide_accessed: ['resource-resume-guide'],
  interview_frameworks_accessed: ['resource-interview-frameworks'],
  negotiation_scripts_accessed: ['resource-negotiation-scripts'],
  prd_template_accessed: ['resource-prd-template'],
} as const;

export type BaselineTrigger = keyof typeof BASELINE_TRIGGERS;

/**
 * Mark baseline actions as complete for a user based on a trigger event
 * @param userId - The user's ID
 * @param trigger - The event trigger type
 * @returns Object with success status and affected action count
 */
export async function markBaselineActionsComplete(
  userId: string,
  trigger: BaselineTrigger
): Promise<{ success: boolean; actionsCompleted: number; error?: string }> {
  try {
    const actionIds = BASELINE_TRIGGERS[trigger];
    if (!actionIds) {
      return { success: true, actionsCompleted: 0 };
    }

    const supabase = await createClient();

    // Update matching baseline actions to completed
    const { data, error } = await supabase
      .from('user_baseline_actions')
      .update({ is_completed: true })
      .eq('user_id', userId)
      .in('action_id', actionIds)
      .eq('is_completed', false) // Only update if not already completed
      .select('id');

    if (error) {
      console.error('Error marking baseline actions complete:', error);
      return { success: false, actionsCompleted: 0, error: error.message };
    }

    const actionsCompleted = data?.length || 0;

    // If actions were completed, check if all baseline actions are now done
    if (actionsCompleted > 0) {
      await checkAndUpdateBaselineAllComplete(userId);

      // Log goal event
      await supabase.from('goal_events').insert({
        user_id: userId,
        event_type: 'baseline_action_completed',
        goal_id: trigger,
        metadata: {
          trigger,
          action_ids: actionIds,
          actions_completed: actionsCompleted,
        },
      });
    }

    return { success: true, actionsCompleted };
  } catch (error) {
    console.error('Error in markBaselineActionsComplete:', error);
    return {
      success: false,
      actionsCompleted: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if all baseline actions are complete and update user_plans if so
 */
async function checkAndUpdateBaselineAllComplete(userId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Count incomplete baseline actions
    const { count, error } = await supabase
      .from('user_baseline_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', false);

    if (error) {
      console.error('Error checking baseline completion:', error);
      return;
    }

    // If no incomplete actions, mark baseline_all_complete
    if (count === 0) {
      await supabase
        .from('user_plans')
        .update({
          baseline_all_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // Log goal event for baseline completion
      await supabase.from('goal_events').insert({
        user_id: userId,
        event_type: 'baseline_all_complete',
        goal_id: 'baseline',
        metadata: {
          completed_at: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Error in checkAndUpdateBaselineAllComplete:', error);
  }
}

/**
 * Get baseline action completion status for a user
 */
export async function getBaselineActionStatus(
  userId: string,
  actionId: string
): Promise<boolean | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_baseline_actions')
      .select('is_completed')
      .eq('user_id', userId)
      .eq('action_id', actionId)
      .maybeSingle();

    if (error) {
      console.error('Error getting baseline action status:', error);
      return null;
    }

    return data?.is_completed ?? null;
  } catch (error) {
    console.error('Error in getBaselineActionStatus:', error);
    return null;
  }
}
