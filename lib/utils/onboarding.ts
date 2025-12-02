import { createClient } from '@/lib/supabase/server';

export interface OnboardingProgress {
  id: string;
  user_id: string;
  current_step: string | null;
  completed_steps: string[];
  skipped_steps: string[];
  progress_data: {
    // New onboarding flow steps
    personal_info?: {
      firstName?: string;
      lastName?: string;
      careerStage?: string;
      currentRole?: string;
      currentSalary?: number;
    };
    goals?: {
      targetRole?: string;
      timeline?: string;
      struggles?: string;
      jobSearchStage?: string;
      interviewConfidence?: number;
    };
    portfolio?: {
      hasPortfolio?: string;
      wantsPortfolio?: string | null;
    };
    // Plan display step (Phase 2B)
    plan_display?: {
      planGenerated?: boolean;
      generatedAt?: string;
    };
    // Confirm goals step (Phase 2B)
    confirm_goals?: {
      confirmedGoals?: Array<{
        id: string;
        label: string;
        target: number | null;
      }>;
      totalGoals?: number;
      enabledGoals?: number;
      confirmedAt?: string;
    };
    // Legacy steps (kept for backwards compatibility)
    resume_upload?: {
      versionId?: string;
      uploadedAt?: string;
      analysisStatus?: 'pending' | 'processing' | 'completed' | 'failed';
      analysisData?: any;
    };
    baseline?: {
      careerStage?: string;
      currentSalary?: number;
      goals?: string;
    };
    targets?: {
      targetRole?: string;
      timeline?: string;
      targetSalary?: number;
      companyTypes?: string[];
    };
    feature_interests?: {
      courses?: boolean;
      resumeEditor?: boolean;
      jobCenter?: boolean;
      portfolio?: boolean;
      pmResources?: boolean;
    };
    trial?: {
      selectedPlan?: string;
      billingCadence?: string;
      startedAt?: string;
    };
  };
  is_complete: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Check if user has completed onboarding
 * Returns true if onboarding is complete, false if incomplete or no record exists
 */
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('is_complete')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking onboarding status:', error);
      // If error, assume incomplete to be safe
      return false;
    }

    // If no record exists, user hasn't started onboarding (incomplete)
    if (!data) {
      return false;
    }

    return data.is_complete === true;
  } catch (error) {
    console.error('Error in isOnboardingComplete:', error);
    return false;
  }
}

/**
 * Get user's onboarding progress
 */
export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching onboarding progress:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getOnboardingProgress:', error);
    return null;
  }
}

/**
 * Get the correct redirect path based on onboarding status
 * Returns '/dashboard' if onboarding is complete, '/onboarding' if incomplete
 * Defaults to '/onboarding' if check fails (to be safe and not block users)
 */
export async function getOnboardingRedirectPath(userId: string): Promise<string> {
  try {
    const complete = await isOnboardingComplete(userId);
    return complete ? '/dashboard' : '/onboarding';
  } catch (error) {
    console.error('Error in getOnboardingRedirectPath:', error);
    // Default to onboarding if check fails to prevent blocking users
    return '/onboarding';
  }
}




