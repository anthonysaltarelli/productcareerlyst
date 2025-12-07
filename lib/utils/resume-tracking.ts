'use client';

import { createClient } from '@/lib/supabase/client';
import type { ResumeData } from '@/app/components/resume/mockData';
import type { ResumeVersion } from '@/lib/hooks/useResumeData';

/**
 * Get user plan from client-side
 * Returns 'learn' | 'accelerate' | null
 */
export const getUserPlanClient = async (): Promise<'learn' | 'accelerate' | null> => {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Fetch subscription from client
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return subscription?.plan || null;
  } catch (error) {
    console.error('Error getting user plan:', error);
    return null;
  }
};

/**
 * Calculate resume completeness score
 */
export const calculateResumeCompleteness = (resumeData: ResumeData): {
  hasContactInfo: boolean;
  hasSummary: boolean;
  experienceCount: number;
  educationCount: number;
  technicalSkillsCount: number;
  productSkillsCount: number;
  softSkillsCount: number;
  totalBulletsCount: number;
  selectedBulletsCount: number;
  completenessScore: number;
} => {
  const hasContactInfo = !!(resumeData.contactInfo.name && resumeData.contactInfo.email);
  const hasSummary = !!resumeData.summary && resumeData.summary.trim().length > 0;
  const experienceCount = resumeData.experiences.length;
  const educationCount = resumeData.education.length;
  const technicalSkillsCount = resumeData.skills.technical.length;
  const productSkillsCount = resumeData.skills.product.length;
  const softSkillsCount = resumeData.skills.soft.length;
  
  const totalBulletsCount = resumeData.experiences.reduce((sum, exp) => sum + exp.bullets.length, 0);
  const selectedBulletsCount = resumeData.experiences.reduce(
    (sum, exp) => sum + exp.bullets.filter(b => b.isSelected).length,
    0
  );

  // Calculate completeness score (0-100)
  let score = 0;
  if (hasContactInfo) score += 20;
  if (hasSummary) score += 10;
  if (experienceCount > 0) score += 30;
  if (educationCount > 0) score += 10;
  if (technicalSkillsCount > 0 || productSkillsCount > 0 || softSkillsCount > 0) score += 10;
  if (selectedBulletsCount > 0) score += 20;

  return {
    hasContactInfo,
    hasSummary,
    experienceCount,
    educationCount,
    technicalSkillsCount,
    productSkillsCount,
    softSkillsCount,
    totalBulletsCount,
    selectedBulletsCount,
    completenessScore: score,
  };
};

/**
 * Calculate days since date
 */
export const daysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get base user context properties for tracking
 */
export const getBaseUserContext = async (): Promise<{
  userPlan: 'learn' | 'accelerate' | null;
  daysSinceSignUp: number | null;
}> => {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        userPlan: null,
        daysSinceSignUp: null,
      };
    }

    const userPlan = await getUserPlanClient();
    
    // Get user creation date
    let daysSinceSignUp: number | null = null;
    if (user.created_at) {
      daysSinceSignUp = daysSince(user.created_at);
    }

    return {
      userPlan,
      daysSinceSignUp,
    };
  } catch (error) {
    console.error('Error getting base user context:', error);
    return {
      userPlan: null,
      daysSinceSignUp: null,
    };
  }
};

/**
 * Get resume context properties for tracking
 */
export const getResumeContext = (
  version: ResumeVersion | null,
  resumeData: ResumeData | null
): {
  resumeVersionId: string | null;
  resumeName: string | null;
  isMasterResume: boolean;
  resumeAge: number | null;
  resumeCompleteness: ReturnType<typeof calculateResumeCompleteness> | null;
} => {
  if (!version) {
    return {
      resumeVersionId: null,
      resumeName: null,
      isMasterResume: false,
      resumeAge: null,
      resumeCompleteness: null,
    };
  }

  const resumeAge = version.created_at ? daysSince(version.created_at) : null;
  const resumeCompleteness = resumeData ? calculateResumeCompleteness(resumeData) : null;

  return {
    resumeVersionId: version.id,
    resumeName: version.name,
    isMasterResume: version.is_master,
    resumeAge,
    resumeCompleteness,
  };
};









