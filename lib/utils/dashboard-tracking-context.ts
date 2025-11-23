import type { DashboardStats } from '@/app/api/dashboard/stats/route';

interface Subscription {
  plan: 'learn' | 'accelerate' | null;
  status: string | null;
  isActive: boolean;
}

interface FeatureFlags {
  coach?: boolean;
  compensation?: boolean;
  impactPortfolio?: boolean;
  careerTracker?: boolean;
}

interface UserCreationDate {
  createdAt?: string | null;
}

/**
 * Generate user state properties for dashboard tracking events
 * This ensures consistent user context across all dashboard events
 */
export const getDashboardTrackingContext = (
  stats: DashboardStats | null,
  subscription: Subscription | null,
  featureFlags: FeatureFlags = {},
  userCreationDate?: UserCreationDate
): Record<string, any> => {
  if (!stats) {
    return {
      'Subscription Plan': subscription?.plan || null,
      'Subscription Status': subscription?.status || null,
      'Is Subscription Active': subscription?.isActive || false,
    };
  }

  // Calculate onboarding completion percentage
  const totalMilestones = 10;
  const completedMilestones = Object.values(stats.milestones).filter(Boolean).length;
  const onboardingCompletionPercentage = Math.round((completedMilestones / totalMilestones) * 100);

  // Calculate days since signup
  let daysSinceSignup: number | null = null;
  if (userCreationDate?.createdAt) {
    const signupDate = new Date(userCreationDate.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - signupDate.getTime());
    daysSinceSignup = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get enabled feature flags
  const enabledFeatureFlags: string[] = [];
  if (featureFlags.coach) enabledFeatureFlags.push('coach');
  if (featureFlags.compensation) enabledFeatureFlags.push('compensation');
  if (featureFlags.impactPortfolio) enabledFeatureFlags.push('impactPortfolio');
  if (featureFlags.careerTracker) enabledFeatureFlags.push('careerTracker');

  return {
    // Subscription info
    'Subscription Plan': subscription?.plan || null,
    'Subscription Status': subscription?.status || null,
    'Is Subscription Active': subscription?.isActive || false,

    // Onboarding progress
    'Onboarding Completion Percentage': onboardingCompletionPercentage,
    'Milestones Completed Count': completedMilestones,
    'Total Milestones': totalMilestones,

    // Key metrics
    'Lessons Completed': stats.lessonsCompleted,
    'Courses Completed': stats.coursesCompleted,
    'Highest Resume Score': stats.highestResumeScore,
    'Total Job Applications': stats.totalJobApplications,
    'Resume Versions Count': stats.resumeVersionsCount,
    'Contacts Count': stats.contactsCount,
    'Companies Researched Count': stats.companiesResearchedCount,

    // Individual milestone status
    'Milestone: First Lesson Watched': stats.milestones.firstLessonWatched,
    'Milestone: First Course Completed': stats.milestones.firstCourseCompleted,
    'Milestone: First Resume Imported': stats.milestones.firstResumeImported,
    'Milestone: Resume Score 70+': stats.milestones.resumeScore70,
    'Milestone: Resume Score 80+': stats.milestones.resumeScore80,
    'Milestone: Resume Score 90+': stats.milestones.resumeScore90,
    'Milestone: First Template Accessed': stats.milestones.firstTemplateAccessed,
    'Milestone: First Job Added': stats.milestones.firstJobAdded,
    'Milestone: First Contact Added': stats.milestones.firstContactAdded,
    'Milestone: First Research Viewed': stats.milestones.firstResearchViewed,

    // Feature flags
    'Feature Flags Enabled': enabledFeatureFlags.length > 0 ? enabledFeatureFlags : [],

    // User lifecycle
    'Days Since Signup': daysSinceSignup,
  };
};

