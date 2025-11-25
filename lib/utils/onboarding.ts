import { createClient } from '@/lib/supabase/server';

export interface OnboardingProgress {
  id: string;
  user_id: string;
  current_step: string | null;
  completed_steps: string[];
  skipped_steps: string[];
  progress_data: {
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




