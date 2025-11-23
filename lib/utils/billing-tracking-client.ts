/**
 * Client-side billing tracking utilities
 * These functions are pure and don't require server-side dependencies
 */

import { type PlanType } from '@/lib/stripe/client';

export type SubscriptionStatus = 
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid'
  | 'paused';

export interface UserStateContext {
  // Subscription state
  currentPlan: PlanType | null;
  currentBillingCadence: 'monthly' | 'quarterly' | 'yearly' | null;
  subscriptionStatus: SubscriptionStatus | null;
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

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

