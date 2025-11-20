import { createClient } from '@/lib/supabase/server';
import { PLAN_LIMITS, type PlanType } from '@/lib/stripe/client';

export type SubscriptionStatus = 
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid'
  | 'paused';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: PlanType;
  billing_cadence: 'monthly' | 'quarterly' | 'yearly';
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  stripe_price_id: string;
  created_at: string;
  updated_at: string;
}

export type FeatureType =
  | 'pm_emails_discovered'
  | 'outreach_messages_created'
  | 'resume_bullet_optimizations'
  | 'resume_customizations_for_jobs'
  | 'product_portfolio_case_study_ideas'
  | 'jobs_tracked'
  | 'custom_questions_for_interviewers'
  | 'automated_company_research_searches';

/**
 * Get user's active subscription
 */
export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  // Debug logging
  if (data) {
    console.log('getUserSubscription - Fetched subscription:', {
      id: data.id,
      cancel_at_period_end: data.cancel_at_period_end,
      cancel_at_period_end_type: typeof data.cancel_at_period_end,
      status: data.status,
      current_period_end: data.current_period_end,
    });
  }

  return data as Subscription | null;
};

/**
 * Check if user has an active subscription
 */
export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  const subscription = await getUserSubscription(userId);
  return subscription !== null;
};

/**
 * Get user's plan type (learn, accelerate, or null)
 */
export const getUserPlan = async (userId: string): Promise<PlanType | null> => {
  const subscription = await getUserSubscription(userId);
  return subscription?.plan || null;
};

/**
 * Check if user has access to a feature
 */
export const hasFeatureAccess = async (
  userId: string,
  feature: FeatureType | 'product_portfolio_template'
): Promise<boolean> => {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return false;
  }

  const plan = subscription.plan;
  const limit = PLAN_LIMITS[plan][feature as keyof typeof PLAN_LIMITS[typeof plan]];

  if (feature === 'product_portfolio_template') {
    return limit === true;
  }

  // For unlimited features, limit is Infinity
  return limit === Infinity;
};

/**
 * Get feature limit for user's plan
 */
export const getFeatureLimit = async (
  userId: string,
  feature: FeatureType | 'product_portfolio_template'
): Promise<number | boolean | null> => {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return null;
  }

  const plan = subscription.plan;
  return PLAN_LIMITS[plan][feature as keyof typeof PLAN_LIMITS[typeof plan]];
};

/**
 * Get current month-year string (YYYY-MM)
 */
export const getCurrentMonthYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get feature usage count for current month
 */
export const getFeatureUsage = async (
  userId: string,
  feature: FeatureType
): Promise<number> => {
  const supabase = await createClient();
  const monthYear = getCurrentMonthYear();

  const { data, error } = await supabase
    .from('subscription_usage')
    .select('usage_count')
    .eq('user_id', userId)
    .eq('feature_type', feature)
    .eq('month_year', monthYear)
    .maybeSingle();

  if (error || !data) {
    return 0;
  }

  return data.usage_count;
};

/**
 * Check if user can use a feature (within limits)
 */
export const canUseFeature = async (
  userId: string,
  feature: FeatureType
): Promise<{ allowed: boolean; current: number; limit: number | null; resetDate: string }> => {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return {
      allowed: false,
      current: 0,
      limit: null,
      resetDate: '',
    };
  }

  const plan = subscription.plan;
  const limit = PLAN_LIMITS[plan][feature];

  // Unlimited features
  if (limit === Infinity) {
    return {
      allowed: true,
      current: 0,
      limit: Infinity,
      resetDate: '',
    };
  }

  // Check current usage
  const current = await getFeatureUsage(userId, feature);

  // Calculate reset date (first day of next month)
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const resetDate = nextMonth.toISOString().split('T')[0];

  return {
    allowed: current < limit,
    current,
    limit,
    resetDate,
  };
};

/**
 * Increment feature usage
 */
export const incrementFeatureUsage = async (
  userId: string,
  feature: FeatureType
): Promise<{ success: boolean; newCount: number }> => {
  const supabase = await createClient();
  const monthYear = getCurrentMonthYear();

  // Check if record exists
  const { data: existing } = await supabase
    .from('subscription_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('feature_type', feature)
    .eq('month_year', monthYear)
    .maybeSingle();

  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('subscription_usage')
      .update({ usage_count: existing.usage_count + 1 })
      .eq('id', existing.id)
      .select('usage_count')
      .single();

    if (error) {
      console.error('Error incrementing usage:', error);
      return { success: false, newCount: existing.usage_count };
    }

    return { success: true, newCount: data.usage_count };
  } else {
    // Create new record
    const { data, error } = await supabase
      .from('subscription_usage')
      .insert({
        user_id: userId,
        feature_type: feature,
        month_year: monthYear,
        usage_count: 1,
      })
      .select('usage_count')
      .single();

    if (error) {
      console.error('Error creating usage record:', error);
      return { success: false, newCount: 0 };
    }

    return { success: true, newCount: data.usage_count };
  }
};

