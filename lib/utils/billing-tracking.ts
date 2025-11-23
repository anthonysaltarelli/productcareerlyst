import { getUserSubscription, Subscription } from '@/lib/utils/subscription';
import { getFeatureUsage, FeatureType } from '@/lib/utils/subscription';

export interface UserStateContext {
  // Subscription state
  currentPlan: 'learn' | 'accelerate' | null;
  currentBillingCadence: 'monthly' | 'quarterly' | 'yearly' | null;
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused' | null;
  cancelAtPeriodEnd: boolean;
  daysSinceSubscriptionStart: number | null;
  daysUntilPeriodEnd: number | null;
  isTrialUser: boolean;
  hasPastDue: boolean;
  
  // Onboarding state
  userOnboardingStage: 'no_subscription' | 'trial_active' | 'first_payment_pending' | 'active_subscriber' | 'canceled_pending_end' | 'churned';
  daysSinceAccountCreation: number | null;
  hasUsedFeature: boolean;
  featureUsageCount: number;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get user state context for tracking
 * @param userId - User ID
 * @param accountCreatedAt - Optional account creation date (from user.created_at)
 */
export async function getUserStateContext(
  userId: string,
  accountCreatedAt?: string | null
): Promise<UserStateContext> {
  const daysSinceAccountCreation = accountCreatedAt ? daysBetween(new Date(accountCreatedAt), new Date()) : null;
  
  // Get subscription
  const subscription = await getUserSubscription(userId);
  
  // Default values
  let currentPlan: 'learn' | 'accelerate' | null = null;
  let currentBillingCadence: 'monthly' | 'quarterly' | 'yearly' | null = null;
  let subscriptionStatus: UserStateContext['subscriptionStatus'] = null;
  let cancelAtPeriodEnd = false;
  let daysSinceSubscriptionStart: number | null = null;
  let daysUntilPeriodEnd: number | null = null;
  let isTrialUser = false;
  let hasPastDue = false;
  let userOnboardingStage: UserStateContext['userOnboardingStage'] = 'no_subscription';
  
  if (subscription) {
    currentPlan = subscription.plan;
    currentBillingCadence = subscription.billing_cadence;
    subscriptionStatus = subscription.status;
    
    // Handle cancel_at_period_end (can be boolean, string, or number)
    const cancelAtPeriodEndValue = subscription.cancel_at_period_end as any;
    cancelAtPeriodEnd = Boolean(
      cancelAtPeriodEndValue === true || 
      cancelAtPeriodEndValue === 'true' ||
      cancelAtPeriodEndValue === 1
    );
    
    // Calculate days since subscription start
    if (subscription.created_at) {
      const subscriptionStart = new Date(subscription.created_at);
      daysSinceSubscriptionStart = daysBetween(subscriptionStart, new Date());
    }
    
    // Calculate days until period end
    if (subscription.current_period_end) {
      const periodEnd = new Date(subscription.current_period_end);
      daysUntilPeriodEnd = daysBetween(new Date(), periodEnd);
    }
    
    isTrialUser = subscription.status === 'trialing';
    hasPastDue = subscription.status === 'past_due';
    
    // Determine onboarding stage
    if (subscription.status === 'trialing') {
      userOnboardingStage = 'trial_active';
    } else if (subscription.status === 'active') {
      if (cancelAtPeriodEnd) {
        userOnboardingStage = 'canceled_pending_end';
      } else {
        userOnboardingStage = 'active_subscriber';
      }
    } else if (subscription.status === 'past_due') {
      userOnboardingStage = 'first_payment_pending';
    } else if (subscription.status === 'canceled') {
      userOnboardingStage = 'churned';
    }
  }
  
  // Check feature usage
  const features: FeatureType[] = [
    'pm_emails_discovered',
    'outreach_messages_created',
    'resume_bullet_optimizations',
    'resume_customizations_for_jobs',
    'product_portfolio_case_study_ideas',
    'jobs_tracked',
    'custom_questions_for_interviewers',
    'automated_company_research_searches',
  ];
  
  let featureUsageCount = 0;
  let hasUsedFeature = false;
  
  for (const feature of features) {
    const usage = await getFeatureUsage(userId, feature);
    featureUsageCount += usage;
    if (usage > 0) {
      hasUsedFeature = true;
    }
  }
  
  return {
    currentPlan,
    currentBillingCadence,
    subscriptionStatus,
    cancelAtPeriodEnd,
    daysSinceSubscriptionStart,
    daysUntilPeriodEnd,
    isTrialUser,
    hasPastDue,
    userOnboardingStage,
    daysSinceAccountCreation,
    hasUsedFeature,
    featureUsageCount,
  };
}

/**
 * Get user state context for client-side (simplified, uses subscription object)
 */
export function getUserStateContextFromSubscription(
  subscription: Subscription | null,
  accountCreatedAt: string | null
): Omit<UserStateContext, 'hasUsedFeature' | 'featureUsageCount'> {
  const daysSinceAccountCreation = accountCreatedAt ? daysBetween(new Date(accountCreatedAt), new Date()) : null;
  
  if (!subscription) {
    return {
      currentPlan: null,
      currentBillingCadence: null,
      subscriptionStatus: null,
      cancelAtPeriodEnd: false,
      daysSinceSubscriptionStart: null,
      daysUntilPeriodEnd: null,
      isTrialUser: false,
      hasPastDue: false,
      userOnboardingStage: 'no_subscription',
      daysSinceAccountCreation,
    };
  }
  
  const cancelAtPeriodEndValue = subscription.cancel_at_period_end as any;
  const cancelAtPeriodEnd = Boolean(
    cancelAtPeriodEndValue === true || 
    cancelAtPeriodEndValue === 'true' ||
    cancelAtPeriodEndValue === 1
  );
  
  let daysSinceSubscriptionStart: number | null = null;
  if (subscription.created_at) {
    const subscriptionStart = new Date(subscription.created_at);
    daysSinceSubscriptionStart = daysBetween(subscriptionStart, new Date());
  }
  
  let daysUntilPeriodEnd: number | null = null;
  if (subscription.current_period_end) {
    const periodEnd = new Date(subscription.current_period_end);
    daysUntilPeriodEnd = daysBetween(new Date(), periodEnd);
  }
  
  const isTrialUser = subscription.status === 'trialing';
  const hasPastDue = subscription.status === 'past_due';
  
  let userOnboardingStage: UserStateContext['userOnboardingStage'] = 'no_subscription';
  if (subscription.status === 'trialing') {
    userOnboardingStage = 'trial_active';
  } else if (subscription.status === 'active') {
    if (cancelAtPeriodEnd) {
      userOnboardingStage = 'canceled_pending_end';
    } else {
      userOnboardingStage = 'active_subscriber';
    }
  } else if (subscription.status === 'past_due') {
    userOnboardingStage = 'first_payment_pending';
  } else if (subscription.status === 'canceled') {
    userOnboardingStage = 'churned';
  }
  
  return {
    currentPlan: subscription.plan,
    currentBillingCadence: subscription.billing_cadence,
    subscriptionStatus: subscription.status,
    cancelAtPeriodEnd,
    daysSinceSubscriptionStart,
    daysUntilPeriodEnd,
    isTrialUser,
    hasPastDue,
    userOnboardingStage,
    daysSinceAccountCreation,
  };
}

